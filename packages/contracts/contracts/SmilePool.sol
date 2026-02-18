// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SmilePool
 * @notice A Bitcoin-native crowdfunded reward pool where users donate Runes (ERC20)
 *         and smilers with score >= threshold can claim a fixed reward.
 * @dev    On MIDL, Bitcoin Runes are represented as ERC20 tokens.
 *         Score is passed from the frontend (PoC). Production would use an oracle/zkML.
 *
 * Anti-spam features:
 *   - 1 claim per wallet per day (on-chain cooldown)
 *   - Nonce-based replay protection
 *   - Minimum score threshold enforced on-chain
 *
 * Social features:
 *   - Public smile feed with messages
 *   - Per-user profile stats (total smiles, best score, total earned)
 *   - Recent winners list (last N claims)
 *   - Top smilers leaderboard (sorted by best score)
 */
contract SmilePool is Ownable {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════
    //  Errors
    // ═══════════════════════════════════════════
    error InvalidTokenAddress();
    error InvalidAmount();
    error InsufficientPoolBalance();
    error ScoreTooLow(uint256 score, uint256 threshold);
    error AlreadyClaimedToday();
    error InvalidNonce();

    // ═══════════════════════════════════════════
    //  Core State
    // ═══════════════════════════════════════════
    IERC20 public rewardToken;
    uint256 public rewardAmount;
    uint256 public scoreThreshold;
    uint256 public totalDonated;
    uint256 public totalClaimed;
    uint256 public totalSmiles;

    // ═══════════════════════════════════════════
    //  Anti-Spam: Cooldowns & Nonces
    // ═══════════════════════════════════════════
    mapping(address => uint256) public lastClaimDay;
    mapping(address => uint256) public nonces;

    // ═══════════════════════════════════════════
    //  Social: Smile Feed
    // ═══════════════════════════════════════════
    struct SmileRecord {
        address smiler;
        uint256 score;
        uint256 timestamp;
        uint256 reward;
        string message;
    }
    SmileRecord[] public smileFeed;

    // ═══════════════════════════════════════════
    //  Social: User Profiles
    // ═══════════════════════════════════════════
    struct UserProfile {
        uint256 totalSmiles;
        uint256 bestScore;
        uint256 totalEarned;
        uint256 lastSmileTimestamp;
    }
    mapping(address => UserProfile) public profiles;
    address[] public allSmilers;
    mapping(address => bool) private isSmiler;

    // ═══════════════════════════════════════════
    //  Social: Donors
    // ═══════════════════════════════════════════
    struct DonorRecord {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }
    DonorRecord[] public donationFeed;

    // ═══════════════════════════════════════════
    //  Events
    // ═══════════════════════════════════════════
    event Donated(address indexed donor, uint256 amount);
    event SmileSubmitted(
        address indexed smiler,
        uint256 score,
        uint256 reward,
        string message,
        uint256 feedIndex
    );
    event RewardAmountUpdated(uint256 newAmount);
    event ScoreThresholdUpdated(uint256 newThreshold);
    event TokenUpdated(address indexed newToken);

    // ═══════════════════════════════════════════
    //  Constructor
    // ═══════════════════════════════════════════
    constructor(
        address _rewardToken,
        uint256 _rewardAmount,
        uint256 _scoreThreshold
    ) Ownable(msg.sender) {
        if (_rewardToken == address(0)) revert InvalidTokenAddress();
        rewardToken = IERC20(_rewardToken);
        rewardAmount = _rewardAmount;
        scoreThreshold = _scoreThreshold;
    }

    // ═══════════════════════════════════════════
    //  Core: Donate
    // ═══════════════════════════════════════════

    function donate(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        totalDonated += amount;

        donationFeed.push(DonorRecord({
            donor: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit Donated(msg.sender, amount);
    }

    // ═══════════════════════════════════════════
    //  Core: Claim Reward (with anti-spam)
    // ═══════════════════════════════════════════

    function claimReward(
        uint256 smileScore,
        uint256 nonce,
        string calldata message
    ) external {
        // Anti-spam: verify nonce
        if (nonce != nonces[msg.sender]) revert InvalidNonce();
        nonces[msg.sender]++;

        // Anti-spam: 1 claim per day
        uint256 today = block.timestamp / 1 days;
        if (lastClaimDay[msg.sender] == today) {
            revert AlreadyClaimedToday();
        }
        lastClaimDay[msg.sender] = today;

        // Score check
        if (smileScore < scoreThreshold) {
            revert ScoreTooLow(smileScore, scoreThreshold);
        }

        // Pool balance check
        uint256 poolBalance = rewardToken.balanceOf(address(this));
        if (poolBalance < rewardAmount) {
            revert InsufficientPoolBalance();
        }

        // Update stats
        totalClaimed += rewardAmount;
        totalSmiles++;

        // Update user profile
        _updateProfile(msg.sender, smileScore, rewardAmount);

        // Add to social feed
        uint256 feedIndex = smileFeed.length;
        smileFeed.push(SmileRecord({
            smiler: msg.sender,
            score: smileScore,
            timestamp: block.timestamp,
            reward: rewardAmount,
            message: message
        }));

        // Transfer reward
        rewardToken.safeTransfer(msg.sender, rewardAmount);

        emit SmileSubmitted(msg.sender, smileScore, rewardAmount, message, feedIndex);
    }

    // ═══════════════════════════════════════════
    //  Internal: Profile Management
    // ═══════════════════════════════════════════

    function _updateProfile(address user, uint256 score, uint256 reward) internal {
        UserProfile storage p = profiles[user];
        p.totalSmiles++;
        p.totalEarned += reward;
        p.lastSmileTimestamp = block.timestamp;
        if (score > p.bestScore) {
            p.bestScore = score;
        }

        if (!isSmiler[user]) {
            isSmiler[user] = true;
            allSmilers.push(user);
        }
    }

    // ═══════════════════════════════════════════
    //  View: Pool Info
    // ═══════════════════════════════════════════

    function getPoolBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    function getRewardAmount() external view returns (uint256) {
        return rewardAmount;
    }

    function getScoreThreshold() external view returns (uint256) {
        return scoreThreshold;
    }

    function getPoolStats() external view returns (
        uint256 _poolBalance,
        uint256 _rewardAmount,
        uint256 _scoreThreshold,
        uint256 _totalDonated,
        uint256 _totalClaimed,
        uint256 _totalSmiles,
        uint256 _totalSmilers,
        uint256 _totalDonations
    ) {
        uint256 poolBal = 0;
        address tokenAddr = address(rewardToken);
        uint256 codeSize;
        assembly { codeSize := extcodesize(tokenAddr) }
        if (codeSize > 0) {
            (bool ok, bytes memory data) = tokenAddr.staticcall(
                abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
            );
            if (ok && data.length >= 32) {
                poolBal = abi.decode(data, (uint256));
            }
        }
        return (
            poolBal,
            rewardAmount,
            scoreThreshold,
            totalDonated,
            totalClaimed,
            totalSmiles,
            allSmilers.length,
            donationFeed.length
        );
    }

    // ═══════════════════════════════════════════
    //  View: Social Feed
    // ═══════════════════════════════════════════

    function getFeedLength() external view returns (uint256) {
        return smileFeed.length;
    }

    function getRecentSmiles(uint256 count) external view returns (SmileRecord[] memory) {
        uint256 len = smileFeed.length;
        if (count > len) count = len;
        SmileRecord[] memory recent = new SmileRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = smileFeed[len - count + i];
        }
        return recent;
    }

    function getRecentDonations(uint256 count) external view returns (DonorRecord[] memory) {
        uint256 len = donationFeed.length;
        if (count > len) count = len;
        DonorRecord[] memory recent = new DonorRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = donationFeed[len - count + i];
        }
        return recent;
    }

    // ═══════════════════════════════════════════
    //  View: User Profiles & Leaderboard
    // ═══════════════════════════════════════════

    function getUserProfile(address user) external view returns (UserProfile memory) {
        return profiles[user];
    }

    function getUserNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function getTotalSmilers() external view returns (uint256) {
        return allSmilers.length;
    }

    function getTopSmilers(uint256 count) external view returns (
        address[] memory addrs,
        uint256[] memory bestScores,
        uint256[] memory totalSmilesCounts,
        uint256[] memory totalEarnedAmounts
    ) {
        uint256 total = allSmilers.length;
        if (count > total) count = total;
        if (count > 50) count = 50;

        address[] memory tempAddrs = new address[](total);
        uint256[] memory tempScores = new uint256[](total);

        for (uint256 i = 0; i < total; i++) {
            tempAddrs[i] = allSmilers[i];
            tempScores[i] = profiles[allSmilers[i]].bestScore;
        }

        for (uint256 i = 0; i < count; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < total; j++) {
                if (tempScores[j] > tempScores[maxIdx]) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                (tempAddrs[i], tempAddrs[maxIdx]) = (tempAddrs[maxIdx], tempAddrs[i]);
                (tempScores[i], tempScores[maxIdx]) = (tempScores[maxIdx], tempScores[i]);
            }
        }

        addrs = new address[](count);
        bestScores = new uint256[](count);
        totalSmilesCounts = new uint256[](count);
        totalEarnedAmounts = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            addrs[i] = tempAddrs[i];
            bestScores[i] = tempScores[i];
            totalSmilesCounts[i] = profiles[tempAddrs[i]].totalSmiles;
            totalEarnedAmounts[i] = profiles[tempAddrs[i]].totalEarned;
        }
    }

    // ═══════════════════════════════════════════
    //  Owner: Configuration
    // ═══════════════════════════════════════════

    function setRewardAmount(uint256 _rewardAmount) external onlyOwner {
        rewardAmount = _rewardAmount;
        emit RewardAmountUpdated(_rewardAmount);
    }

    function setScoreThreshold(uint256 _scoreThreshold) external onlyOwner {
        scoreThreshold = _scoreThreshold;
        emit ScoreThresholdUpdated(_scoreThreshold);
    }

    function setRewardToken(address _token) external onlyOwner {
        if (_token == address(0)) revert InvalidTokenAddress();
        rewardToken = IERC20(_token);
        emit TokenUpdated(_token);
    }
}
