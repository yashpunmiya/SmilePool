import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy SmilePool contract to MIDL regtest
 *
 * Constructor args:
 *   _rewardToken: ERC20 address of the Rune token (set after minting at runes.midl.xyz)
 *   _rewardAmount: Fixed reward per successful smile claim (in token units with decimals)
 *   _scoreThreshold: Minimum smile score to claim (75)
 */
const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // TODO: Replace with your actual Rune ERC20 address after minting
  const RUNE_ERC20_ADDRESS =
    process.env.RUNE_ERC20_ADDRESS ||
    "0x0000000000000000000000000000000000000000";

  // 100 tokens as reward (assuming 18 decimals)
  const REWARD_AMOUNT = BigInt("100000000000000000000");

  // Minimum score of 75 to claim
  const SCORE_THRESHOLD = 75;

  // 1. Initialize the MIDL hardhat deploy SDK
  await hre.midl.initialize();

  // 2. Add the deploy contract transaction intention
  await hre.midl.deploy("SmilePool", {
    args: [RUNE_ERC20_ADDRESS, REWARD_AMOUNT, SCORE_THRESHOLD],
  });

  // 3. Sends the BTC transaction and EVM transaction to the network
  await hre.midl.execute();
};

deploy.tags = ["main", "SmilePool"];

export default deploy;
