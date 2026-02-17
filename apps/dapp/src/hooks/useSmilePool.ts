import { useState, useCallback } from "react";
import { useAddTxIntention, useFinalizeBTCTransaction, useSignIntention, useAddCompleteTxIntention } from "@midl/executor-react";
import { useWaitForTransaction } from "@midl/react";
import { encodeFunctionData, createPublicClient, http } from "viem";
import { smilePoolAbi, smilePoolAddress, erc20Abi } from "../lib/contracts";
import { EXPLORER_URL, MIDL_RPC, CHAIN_ID } from "../config";

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
        const client = createPublicClient({
          chain: midlChain,
          transport: http(MIDL_RPC),
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
    [addTxIntentionAsync, addCompleteTxIntentionAsync, finalizeBTCTransactionAsync, signIntentionAsync, waitForTransactionAsync, fetchNonce]
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
              runes: [{ id: runeId, amount, address: runeERC20Address }],
            },
          },
        });

        const { tx } = await finalizeBTCTransactionAsync({});

        const signedTransactions = [];
        for (const intention of [approveIntention, donateIntention]) {
          const signed = await signIntentionAsync({ intention, txId: tx.id });
          signedTransactions.push(signed);
        }

        const client = createPublicClient({ chain: midlChain, transport: http(MIDL_RPC) });
        await (client as any).sendBTCTransactions({
          serializedTransactions: signedTransactions,
          btcTransaction: tx.hex,
        });

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
    fetchNonce,
    isClaimPending,
    isDonatePending,
    lastTx,
    error,
    clearError: () => setError(null),
  };
}
