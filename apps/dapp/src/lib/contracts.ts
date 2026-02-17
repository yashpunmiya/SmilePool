import { SMILEPOOL_ADDRESS } from "../config";

export const smilePoolAddress = SMILEPOOL_ADDRESS;

export const smilePoolAbi = [
  // claimReward (updated: score + nonce + message)
  {
    inputs: [
      { name: "smileScore", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "message", type: "string" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // donate
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "donate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getPoolBalance
  {
    inputs: [],
    name: "getPoolBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getRewardAmount
  {
    inputs: [],
    name: "getRewardAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getScoreThreshold
  {
    inputs: [],
    name: "getScoreThreshold",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getPoolStats (8-value dashboard)
  {
    inputs: [],
    name: "getPoolStats",
    outputs: [
      { name: "_poolBalance", type: "uint256" },
      { name: "_rewardAmount", type: "uint256" },
      { name: "_scoreThreshold", type: "uint256" },
      { name: "_totalDonated", type: "uint256" },
      { name: "_totalClaimed", type: "uint256" },
      { name: "_totalSmiles", type: "uint256" },
      { name: "_totalSmilers", type: "uint256" },
      { name: "_totalDonations", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getFeedLength
  {
    inputs: [],
    name: "getFeedLength",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getRecentSmiles
  {
    inputs: [{ name: "count", type: "uint256" }],
    name: "getRecentSmiles",
    outputs: [
      {
        components: [
          { name: "smiler", type: "address" },
          { name: "score", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "reward", type: "uint256" },
          { name: "message", type: "string" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getRecentDonations
  {
    inputs: [{ name: "count", type: "uint256" }],
    name: "getRecentDonations",
    outputs: [
      {
        components: [
          { name: "donor", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getTopSmilers
  {
    inputs: [{ name: "count", type: "uint256" }],
    name: "getTopSmilers",
    outputs: [
      { name: "addrs", type: "address[]" },
      { name: "bestScores", type: "uint256[]" },
      { name: "totalSmilesCounts", type: "uint256[]" },
      { name: "totalEarnedAmounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getUserProfile
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserProfile",
    outputs: [
      {
        components: [
          { name: "totalSmiles", type: "uint256" },
          { name: "bestScore", type: "uint256" },
          { name: "totalEarned", type: "uint256" },
          { name: "lastSmileTimestamp", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getUserNonce
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserNonce",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getTotalSmilers
  {
    inputs: [],
    name: "getTotalSmilers",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // rewardToken
  {
    inputs: [],
    name: "rewardToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // totalDonated
  {
    inputs: [],
    name: "totalDonated",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // totalClaimed
  {
    inputs: [],
    name: "totalClaimed",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // totalSmiles
  {
    inputs: [],
    name: "totalSmiles",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "donor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "Donated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "smiler", type: "address" },
      { indexed: false, name: "score", type: "uint256" },
      { indexed: false, name: "reward", type: "uint256" },
      { indexed: false, name: "message", type: "string" },
      { indexed: false, name: "feedIndex", type: "uint256" },
    ],
    name: "SmileSubmitted",
    type: "event",
  },
] as const;

// Standard ERC20 ABI (for approve + balanceOf)
export const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
