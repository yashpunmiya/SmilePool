import { createPublicClient, http, encodeFunctionData, toHex, keccak256, toBytes, concat, pad, encodeAbiParameters } from "viem";

/**
 * Query the Midl precompile to find the ERC20 address for a given Rune ID.
 * On Midl, there's a registry precompile at 0x0000000000000000000000000000000000001003
 * that maps Rune IDs to ERC20 addresses.
 */
async function main() {
  const runeId = process.env.RUNE_ID || "200401:1";
  console.log(`Looking up ERC20 address for Rune: ${runeId}`);

  const client = createPublicClient({
    transport: http("https://evm-rpc.regtest.midl.xyz"),
  });

  // Try the MaestroSymphony provider approach
  const runesUrl = `https://runes.staging.midl.xyz/runes/${encodeURIComponent(runeId)}`;
  console.log(`Trying API: ${runesUrl}`);
  
  try {
    const resp = await fetch(runesUrl);
    const text = await resp.text();
    console.log(`API response (${resp.status}):`, text.substring(0, 500));
  } catch (e) {
    console.log("API error:", e);
  }

  // Try other API patterns
  const urls = [
    `https://runes.staging.midl.xyz/api/v1/runes/${encodeURIComponent(runeId)}`,
    `https://runes.staging.midl.xyz/v1/runes/${encodeURIComponent(runeId)}`,
    `https://runes.staging.midl.xyz/rune/${encodeURIComponent(runeId)}`,
    `https://runes.staging.midl.xyz/${encodeURIComponent(runeId)}`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const text = await resp.text();
        console.log(`\n✅ ${url} (${resp.status}):`, text.substring(0, 500));
      } else {
        console.log(`❌ ${url}: ${resp.status}`);
      }
    } catch (e) {
      console.log(`❌ ${url}: error`);
    }
  }

  // Also try the addRuneERC20Intention approach - query the precompile for the mapping
  // The precompile at 0x1003 has getAssetAddress(bytes32) 
  try {
    // Convert rune ID "200401:1" to the expected format
    const [block, txIndex] = runeId.split(":");
    console.log(`\nRune block: ${block}, txIndex: ${txIndex}`);
    
    // Try reading the precompile directly
    const precompile = "0x0000000000000000000000000000000000001003" as const;
    
    // Try getAsset or getAddress type calls with different selectors
    const result = await client.call({
      to: precompile,
      data: encodeFunctionData({
        abi: [{
          name: "getAssetAddress",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "runeId", type: "string" }],
          outputs: [{ name: "", type: "address" }],
        }],
        functionName: "getAssetAddress",
        args: [runeId],
      }),
    });
    console.log("\nPrecompile getAssetAddress result:", result);
  } catch (e: any) {
    console.log("\nPrecompile query failed:", e.message?.substring(0, 200));
  }
}

main().catch(console.error);
