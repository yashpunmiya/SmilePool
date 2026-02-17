import type { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy SmilePool contract to MIDL regtest
 *
 * Constructor args:
 *   _rewardToken: ERC20 address of the SMILES Rune (200401:1)
 *   _rewardAmount: Fixed reward per successful smile claim (1 SMILES = 1e18)
 *   _scoreThreshold: Minimum smile score to claim (75)
 */
const deploy: DeployFunction = async ({ midl }) => {
  // SMILES Rune (200401:1) ERC20 address on MIDL regtest
  // Computed via getCreate2RuneAddress("200401:1") from @midl/executor
  const RUNE_ERC20_ADDRESS = "0x0973670BC8183d6a8b877fc5bAb44cFa9962C8D6";

  // 1 SMILES token per claim (18 decimals)
  const REWARD_AMOUNT = BigInt("1000000000000000000");

  // Minimum score of 75 to claim
  const SCORE_THRESHOLD = 75;

  console.log("Starting SmilePool deployment...");
  console.log("  Reward Token:", RUNE_ERC20_ADDRESS);
  console.log("  Reward Amount:", REWARD_AMOUNT.toString(), "(1 SMILES)");
  console.log("  Score Threshold:", SCORE_THRESHOLD);

  // 1. Initialize the MIDL hardhat deploy SDK
  await midl.initialize();

  console.log("  Deployer EVM address:", midl.evm.address);

  // 2. Deploy the SmilePool contract
  await midl.deploy("SmilePool", [
    RUNE_ERC20_ADDRESS,
    REWARD_AMOUNT,
    SCORE_THRESHOLD,
  ]);

  // 3. Execute the transaction (BTC + EVM)
  await midl.execute();

  const deployment = await midl.get("SmilePool");
  console.log("SmilePool deployed at:", deployment?.address);
};

deploy.tags = ["main", "SmilePool"];

export default deploy;
