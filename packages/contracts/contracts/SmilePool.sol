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
 */
contract SmilePool is Ownable {
    using SafeERC20 for IERC20;

    // --- Errors ---
    error InvalidTokenAddress();
    error InvalidAmount();
    error InsufficientPoolBalance();
    error ScoreTooLow(uint256 score, uint256 threshold);
    error AlreadyClaimedToday();
    error NoFaceDetected();

    // --- State ---
    IERC20 public rewardToken;
    uint256 public rewardAmount;
    uint256 public scoreThreshold;
    uint256 public totalDonated;
    uint256 public totalClaimed;
    uint256 public totalSmiles;

    // One claim per address per day
    mapping(address => uint256) public lastClaimDay;

    // Leaderboard tracking
    struct SmileRecord {
        address smiler;
        uint256 score;
        uint256 timestamp;
    }
    SmileRecord[] public leaderboard;

    // --- Events ---
    event Donated(address indexed donor, uint256 amount);
    event RewardClaimed(address indexed smiler, uint256 score, uint256 reward);
    event RewardAmountUpdated(uint256 newAmount);
    event ScoreThresholdUpdated(uint256 newThreshold);
    event TokenUpdated(address indexed newToken);

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

    /**
     * @notice Donate Rune tokens to fill the reward pool
     * @param amount Amount of tokens to donate
     */
    function donate(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        totalDonated += amount;
        emit Donated(msg.sender, amount);
    }

    /**
     * @notice Claim a reward if smile score meets threshold
     * @param smileScore The AI-generated smile score (0-100)
     * @dev In production, score would come from an oracle. For PoC, frontend passes it.
     */
    function claimReward(uint256 smileScore) external {
        if (smileScore < scoreThreshold) {
            revert ScoreTooLow(smileScore, scoreThreshold);
        }

        // One claim per day per address
        uint256 today = block.timestamp / 1 days;
        if (lastClaimDay[msg.sender] == today) {
            revert AlreadyClaimedToday();
        }

        uint256 poolBalance = rewardToken.balanceOf(address(this));
        if (poolBalance < rewardAmount) {
            revert InsufficientPoolBalance();
        }

        lastClaimDay[msg.sender] = today;
        totalClaimed += rewardAmount;
        totalSmiles++;

        // Add to leaderboard
        leaderboard.push(SmileRecord({
            smiler: msg.sender,
            score: smileScore,
            timestamp: block.timestamp
        }));

        rewardToken.safeTransfer(msg.sender, rewardAmount);
        emit RewardClaimed(msg.sender, smileScore, rewardAmount);
    }

    // --- View Functions ---

    function getPoolBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    function getRewardAmount() external view returns (uint256) {
        return rewardAmount;
    }

    function getScoreThreshold() external view returns (uint256) {
        return scoreThreshold;
    }

    function getLeaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    /**
     * @notice Get the last N leaderboard entries
     * @param count Number of entries to return (from the end)
     */
    function getRecentSmiles(uint256 count) external view returns (SmileRecord[] memory) {
        uint256 len = leaderboard.length;
        if (count > len) count = len;
        SmileRecord[] memory recent = new SmileRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = leaderboard[len - count + i];
        }
        return recent;
    }

    // --- Owner Functions ---

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
