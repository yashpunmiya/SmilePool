import { SMILEPOOL_ADDRESS } from "../config";

export const smilePoolAddress = SMILEPOOL_ADDRESS;

export const smilePoolAbi = [
  // donate
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "donate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // claimReward
  {
    inputs: [{ name: "smileScore", type: "uint256" }],
    name: "claimReward",
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
  // getLeaderboardLength
  {
    inputs: [],
    name: "getLeaderboardLength",
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
        ],
        name: "",
        type: "tuple[]",
      },
    ],
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
    ],
    name: "RewardClaimed",
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
