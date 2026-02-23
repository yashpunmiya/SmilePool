import { useState, useCallback } from "react";
import { useAddTxIntention, useFinalizeBTCTransaction, useSignIntention, useAddCompleteTxIntention } from "@midl/executor-react";
import { useWaitForTransaction } from "@midl/react";
import { encodeFunctionData, createPublicClient, http, parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { smilePoolAbi, smilePoolAddress, erc20Abi } from "../lib/contracts";
import { EXPLORER_URL, MEMPOOL_URL, MIDL_RPC, CHAIN_ID } from "../config";

// SMILE rune ID and reward amount (1 SMILE = 1 raw unit, ERC20 uses 18 decimals)
const SMILE_RUNE_ID = "202980:1";
const SMILE_ERC20_ADDRESS = "0x0E267e8EB516adeeA7606483828055a56c198AF2" as `0x${string}`;
const WEI = BigInt(1e18);

// Re-export for convenience
export { useEVMAddress } from "@midl/executor-react";

const midlChain = {
  id: CHAIN_ID,
  name: "MIDL Regtest",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: [MIDL_RPC] } },
} as const;

interface TxResult {
  txId: string;
  explorerUrl: string;
}

export function useSmilePool() {
  const { addTxIntentionAsync } = useAddTxIntention();
  const { finalizeBTCTransactionAsync } = useFinalizeBTCTransaction();
  const { signIntentionAsync } = useSignIntention();
  const { waitForTransactionAsync } = useWaitForTransaction();
  const { addCompleteTxIntentionAsync } = useAddCompleteTxIntention();
  const publicClient = usePublicClient();

  const [isClaimPending, setIsClaimPending] = useState(false);
  const [isDonatePending, setIsDonatePending] = useState(false);
  const [lastTx, setLastTx] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the current nonce for the given EVM address
   */
  const fetchNonce = useCallback(async (evmAddress: `0x${string}`): Promise<bigint> => {
    const client = createPublicClient({ chain: midlChain, transport: http(MIDL_RPC) });
    const nonce = await client.readContract({
      address: smilePoolAddress,
      abi: smilePoolAbi,
      functionName: "getUserNonce",
      args: [evmAddress],
    });
    return nonce as bigint;
  }, []);

  /**
   * Claim reward from the SmilePool
   * Flow: fetch nonce → addTxIntention (claimReward) → finalizeBTC → sign → send → wait
   */
  const claimReward = useCallback(
    async (smileScore: number, message: string = "", evmAddress?: `0x${string}`): Promise<TxResult | null> => {
      setIsClaimPending(true);
      setError(null);
      setLastTx(null);

      try {
        // Fetch on-chain nonce for anti-spam
        const nonce = evmAddress ? await fetchNonce(evmAddress) : 0n;

        // 1. Create the claimReward transaction intention
        //    No deposit.runes here — we're NOT sending runes from BTC to EVM.
        //    The contract transfers SMILE ERC20 from pool to user on the EVM side.
        const claimIntention = await addTxIntentionAsync({
          intention: {
            evmTransaction: {
              to: smilePoolAddress,
              data: encodeFunctionData({
                abi: smilePoolAbi,
                functionName: "claimReward",
                args: [BigInt(smileScore), nonce, message],
              }),
            },
          },
          reset: true,
        });

        // Add complete intention — withdraw 1 SMILE rune back to Bitcoin
        // rewardAmount is 1 SMILE = 1e18 sub-units (divisibility=18)
        // Must include address so the executor maps ERC20 burn to Bitcoin Rune output
        const completeIntention = await addCompleteTxIntentionAsync({
          runes: [{ id: SMILE_RUNE_ID, amount: WEI, address: SMILE_ERC20_ADDRESS }],
        });

        // 3. Finalize BTC transaction
        const { tx } = await finalizeBTCTransactionAsync({});

        // 4. Sign each intention
        const signedTransactions = [];
        for (const intention of [claimIntention, completeIntention]) {
          const signed = await signIntentionAsync({
            intention,
            txId: tx.id,
          });
          signedTransactions.push(signed);
        }

        // 5. Send paired BTC+EVM transactions (using wagmi public client with MIDL extensions)
        await publicClient?.sendBTCTransactions({
          serializedTransactions: signedTransactions as `0x${string}`[],
          btcTransaction: tx.hex,
        });

        // 6. Wait for confirmation
        await waitForTransactionAsync({ txId: tx.id });

        // 7. Get the real EVM tx hash from the SmileSubmitted event log
        //    tx.id is the BTC hash; Blockscout needs the EVM 0x hash
        let evmTxHash: string = tx.id;
        let explorerUrl = `${MEMPOOL_URL}/tx/${tx.id}`;
        try {
          const currentBlock = await (publicClient as ReturnType<typeof createPublicClient>).getBlockNumber();
          const logs = await (publicClient as ReturnType<typeof createPublicClient>).getLogs({
            address: smilePoolAddress,
            event: parseAbiItem(
              "event SmileSubmitted(address indexed smiler, uint256 score, uint256 reward, string message, uint256 feedIndex)"
            ),
            fromBlock: currentBlock - 20n,
            toBlock: currentBlock,
          });
          const lastLog = logs.at(-1);
          if (lastLog?.transactionHash) {
            evmTxHash = lastLog.transactionHash;
            explorerUrl = `${EXPLORER_URL}/tx/${lastLog.transactionHash}`;
          }
        } catch {
          // fallback to BTC mempool link
        }

        const result: TxResult = {
          txId: evmTxHash,
          explorerUrl,
        };
        setLastTx(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Claim failed";
        setError(msg);
        console.error("Claim error:", err);
        return null;
      } finally {
        setIsClaimPending(false);
      }
    },
    [addTxIntentionAsync, addCompleteTxIntentionAsync, finalizeBTCTransactionAsync, signIntentionAsync, waitForTransactionAsync, fetchNonce, publicClient]
  );

  /**
   * Donate Rune tokens to the SmilePool
   */
  const donate = useCallback(
    async (
      amount: bigint,
      runeERC20Address: `0x${string}`,
      runeId: string
    ): Promise<TxResult | null> => {
      setIsDonatePending(true);
      setError(null);
      setLastTx(null);

      try {
        // The Rune ERC20 stores balances in sub-units with divisibility=18 (same as ETH).
        // amount = parseUnits(userInput, 18) is already the correct raw sub-unit amount.

        const approveIntention = await addTxIntentionAsync({
          intention: {
            evmTransaction: {
              to: runeERC20Address,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [smilePoolAddress, amount],
              }),
            },
          },
          reset: true,
        });

        const donateIntention = await addTxIntentionAsync({
          intention: {
            evmTransaction: {
              to: smilePoolAddress,
              data: encodeFunctionData({
                abi: smilePoolAbi,
                functionName: "donate",
                args: [amount],
              }),
            },
            deposit: {
              runes: [{ id: runeId, amount: amount, address: runeERC20Address }],
            },
          },
        });

        const { tx } = await finalizeBTCTransactionAsync({});

        const signedTransactions = [];
        for (const intention of [approveIntention, donateIntention]) {
          const signed = await signIntentionAsync({ intention, txId: tx.id });
          signedTransactions.push(signed);
        }

        await publicClient?.sendBTCTransactions({
          serializedTransactions: signedTransactions as `0x${string}`[],
          btcTransaction: tx.hex,
        });

        await waitForTransactionAsync({ txId: tx.id });

        // Get the real EVM tx hash from the Donated event log
        let evmTxHash: string = tx.id;
        let explorerUrl = `${MEMPOOL_URL}/tx/${tx.id}`;
        try {
          const currentBlock = await (publicClient as ReturnType<typeof createPublicClient>).getBlockNumber();
          const logs = await (publicClient as ReturnType<typeof createPublicClient>).getLogs({
            address: smilePoolAddress,
            event: parseAbiItem("event Donated(address indexed donor, uint256 amount)"),
            fromBlock: currentBlock - 20n,
            toBlock: currentBlock,
          });
          const lastLog = logs.at(-1);
          if (lastLog?.transactionHash) {
            evmTxHash = lastLog.transactionHash;
            explorerUrl = `${EXPLORER_URL}/tx/${lastLog.transactionHash}`;
          }
        } catch {
          // fallback to BTC mempool link
        }

        const result: TxResult = {
          txId: evmTxHash,
          explorerUrl,
        };
        setLastTx(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Donation failed";
        setError(msg);
        console.error("Donate error:", err);
        return null;
      } finally {
        setIsDonatePending(false);
      }
    },
    [addTxIntentionAsync, finalizeBTCTransactionAsync, signIntentionAsync, waitForTransactionAsync, publicClient]
  );

  return {
    claimReward,
    donate,
    fetchNonce,
    isClaimPending,
    isDonatePending,
    lastTx,
    error,
    clearError: () => setError(null),
  };
}
