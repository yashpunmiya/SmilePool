/**
 * Whitelist a test wallet for unlimited claims (bypass daily cooldown).
 * Run: pnpm ts-node scripts/whitelist-test-wallet.ts
 */
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

const MNEMONIC =
  process.env.MNEMONIC ||
  "test test test test test test test test test test test junk";

const MIDL_CHAIN = {
  id: 15001,
  name: "MIDL Regtest",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.staging.midl.xyz"] } },
} as const;

const SMILE_POOL_ADDRESS = "0x95Fe30dc9B2ec2647b57c76a651F0EdEb3790f57" as const;
const TEST_WALLET_EVM = "0x7AA046aB3797C002f24D278cEEFc7cFF33497606" as const;

const ABI = parseAbi([
  "function setUnlimitedClaimer(address user, bool enabled) external",
  "function unlimitedClaimers(address user) external view returns (bool)",
  "function owner() external view returns (address)",
]);

async function main() {
  // Derive EVM account from mnemonic (standard m/44'/60'/0'/0/0 path)
  const account = mnemonicToAccount(MNEMONIC);
  console.log("Signer EVM address:", account.address);

  const publicClient = createPublicClient({
    chain: MIDL_CHAIN,
    transport: http("https://rpc.staging.midl.xyz"),
  });

  const walletClient = createWalletClient({
    account,
    chain: MIDL_CHAIN,
    transport: http("https://rpc.staging.midl.xyz"),
  });

  const owner = await publicClient.readContract({
    address: SMILE_POOL_ADDRESS,
    abi: ABI,
    functionName: "owner",
  });
  console.log("Contract owner:", owner);

  const alreadyWhitelisted = await publicClient.readContract({
    address: SMILE_POOL_ADDRESS,
    abi: ABI,
    functionName: "unlimitedClaimers",
    args: [TEST_WALLET_EVM],
  });

  if (alreadyWhitelisted) {
    console.log(`${TEST_WALLET_EVM} is already whitelisted — nothing to do.`);
    return;
  }

  console.log(`Whitelisting ${TEST_WALLET_EVM} for unlimited claims...`);
  const hash = await walletClient.writeContract({
    address: SMILE_POOL_ADDRESS,
    abi: ABI,
    functionName: "setUnlimitedClaimer",
    args: [TEST_WALLET_EVM, true],
  });

  console.log("Tx sent:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Done! Status:", receipt.status, "— Test wallet can now claim unlimited times per day.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
