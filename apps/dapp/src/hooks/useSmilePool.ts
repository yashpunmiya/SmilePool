import { useState, useCallback } from "react";
import { useAddTxIntention, useFinalizeBTCTransaction, useSignIntention, useAddCompleteTxIntention } from "@midl/executor-react";
import { useWaitForTransaction } from "@midl/react";
import { encodeFunctionData } from "viem";
import { smilePoolAbi, smilePoolAddress, erc20Abi } from "../lib/contracts";
import { EXPLORER_URL } from "../config";

// Re-export for convenience
export { useEVMAddress } from "@midl/executor-react";

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

  const [isClaimPending, setIsClaimPending] = useState(false);
  const [isDonatePending, setIsDonatePending] = useState(false);
  const [lastTx, setLastTx] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Claim reward from the SmilePool
   * Flow: addTxIntention (claimReward) → finalizeBTC → sign → send → wait
   */
  const claimReward = useCallback(
    async (smileScore: number): Promise<TxResult | null> => {
      setIsClaimPending(true);
      setError(null);
      setLastTx(null);

      try {
        // 1. Create the claimReward transaction intention
        const claimIntention = await addTxIntentionAsync({
          intention: {
            evmTransaction: {
              to: smilePoolAddress,
              data: encodeFunctionData({
                abi: smilePoolAbi,
                functionName: "claimReward",
                args: [BigInt(smileScore)],
              }),
            },
          },
          reset: true,
        });

        // 2. Add complete intention (to receive rune tokens back to BTC)
        const completeIntention = await addCompleteTxIntentionAsync({});

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

        // 5. Send paired BTC+EVM transactions
        // Access the sendBTCTransactions from the public client through viem
        const { createPublicClient, http } = await import("viem");
        const client = createPublicClient({
          chain: {
            id: 777,
            name: "MIDL Regtest",
            nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
            rpcUrls: { default: { http: ["https://evm-rpc.regtest.midl.xyz"] } },
          },
          transport: http("https://evm-rpc.regtest.midl.xyz"),
        });

        await (client as any).sendBTCTransactions({
          serializedTransactions: signedTransactions,
          btcTransaction: tx.hex,
        });

        // 6. Wait for confirmation
        await waitForTransactionAsync({ txId: tx.id });

        const result: TxResult = {
          txId: tx.id,
          explorerUrl: `${EXPLORER_URL}/tx/${tx.id}`,
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
    [addTxIntentionAsync, addCompleteTxIntentionAsync, finalizeBTCTransactionAsync, signIntentionAsync, waitForTransactionAsync]
  );

  /**
   * Donate Rune tokens to the SmilePool
   * Flow: approve → donate → finalizeBTC → sign → send → wait
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
        // 1. Approve SmilePool to spend the Rune ERC20 tokens
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

        // 2. Create the donate transaction intention with rune deposit
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
              runes: [
                {
                  id: runeId,
                  amount,
                  address: runeERC20Address,
                },
              ],
            },
          },
        });

        // 3. Finalize BTC transaction
        const { tx } = await finalizeBTCTransactionAsync({});

        // 4. Sign each intention
        const signedTransactions = [];
        for (const intention of [approveIntention, donateIntention]) {
          const signed = await signIntentionAsync({
            intention,
            txId: tx.id,
          });
          signedTransactions.push(signed);
        }

        // 5. Send paired BTC+EVM transactions
        const { createPublicClient, http } = await import("viem");
        const client = createPublicClient({
          chain: {
            id: 777,
            name: "MIDL Regtest",
            nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
            rpcUrls: { default: { http: ["https://evm-rpc.regtest.midl.xyz"] } },
          },
          transport: http("https://evm-rpc.regtest.midl.xyz"),
        });

        await (client as any).sendBTCTransactions({
          serializedTransactions: signedTransactions,
          btcTransaction: tx.hex,
        });

        // 6. Wait for confirmation
        await waitForTransactionAsync({ txId: tx.id });

        const result: TxResult = {
          txId: tx.id,
          explorerUrl: `${EXPLORER_URL}/tx/${tx.id}`,
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
    [addTxIntentionAsync, finalizeBTCTransactionAsync, signIntentionAsync, waitForTransactionAsync]
  );

  return {
    claimReward,
    donate,
    isClaimPending,
    isDonatePending,
    lastTx,
    error,
    clearError: () => setError(null),
  };
}
