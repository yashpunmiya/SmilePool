import { motion } from "framer-motion";
import { useSmilePool, useEVMAddress } from "../hooks/useSmilePool";
import { usePoolBalance } from "../hooks/usePoolBalance";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { createPublicClient, http, type Address } from "viem";
import { MIDL_RPC, CHAIN_ID } from "../config";
import { smilePoolAbi, smilePoolAddress } from "../lib/contracts";

const midlClient = createPublicClient({
  chain: {
    id: CHAIN_ID,
    name: "MIDL Regtest",
    nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
    rpcUrls: { default: { http: [MIDL_RPC] } },
  } as const,
  transport: http(MIDL_RPC),
});

// Custom error decode helper
function decodeClaimError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Named error strings (viem decodes these if the ABI is provided)
  if (msg.includes("AlreadyClaimedToday")) return "Already claimed today — come back tomorrow!";
  if (msg.includes("InsufficientPoolBalance")) return "Pool is empty — someone needs to donate SMILE.";
  if (msg.includes("ScoreTooLow")) return "Score too low — need 75+ to claim.";
  if (msg.includes("InvalidNonce")) return "Nonce mismatch — please refresh and try again.";
  // Bare "execution reverted" from eth_estimateGasMulti (no data available)
  if (msg.includes("execution reverted")) {
    return "Transaction would revert. The pool may be low on funds or you may have already claimed today.";
  }
  // Return a trimmed version of the raw error
  return msg.split("\n")[0].replace(/^Error:\s*/i, "").slice(0, 120);
}

interface ClaimButtonProps {
  score: number | null;
  message?: string;
}

export function ClaimButton({ score, message = "" }: ClaimButtonProps) {
  const { claimReward, isClaimPending, lastTx, error } = useSmilePool();
  const evmAddress = useEVMAddress();
  const { data: poolData, refetch } = usePoolBalance();
  const [claimed, setClaimed] = useState(false);
  const [alreadyClaimedToday, setAlreadyClaimedToday] = useState(false);

  // Check if user already claimed today
  useEffect(() => {
    if (!evmAddress) return;
    midlClient
      .readContract({
        address: smilePoolAddress,
        abi: smilePoolAbi,
        functionName: "lastClaimDay",
        args: [evmAddress as Address],
      })
      .then((lastDay) => {
        const today = BigInt(Math.floor(Date.now() / 86400000));
        setAlreadyClaimedToday(BigInt(lastDay as bigint) === today);
      })
      .catch(() => setAlreadyClaimedToday(false));
  }, [evmAddress, claimed]);

  // Pool is insufficient if balance < rewardAmount (not just if balance = 0)
  const poolInsufficient = poolData
    ? poolData.poolBalance < poolData.rewardAmount
    : false;

  const canClaim =
    score !== null &&
    score >= 75 &&
    !isClaimPending &&
    !claimed &&
    !poolInsufficient &&
    !alreadyClaimedToday;

  const handleClaim = async () => {
    if (!canClaim || score === null) return;

    const result = await claimReward(score, message, evmAddress ?? undefined);
    if (result) {
      setClaimed(true);
      refetch();

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#F7931A", "#FFD740", "#00C853", "#FF5252"],
      });
    }
  };

  useEffect(() => {
    setClaimed(false);
  }, [score]);

  if (score === null || score < 75) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-btc-card/80 border border-btc-orange/20 p-5 flex flex-col items-center gap-3"
    >
      <h3 className="text-base font-bold text-btc-orange">
        🎉 You're Eligible!
      </h3>

      {poolInsufficient && !alreadyClaimedToday ? (
        <div className="bg-btc-amber/10 border border-btc-amber/20 rounded-xl p-3 w-full text-center">
          <p className="text-btc-amber text-xs font-medium">Pool is empty — no rewards yet</p>
          <p className="text-btc-muted text-[10px] mt-1">
            Switch to "Fund" tab and donate SMILE Rune tokens to enable rewards.
          </p>
        </div>
      ) : alreadyClaimedToday ? (
        <div className="bg-btc-muted/10 border border-btc-border/30 rounded-xl p-3 w-full text-center">
          <p className="text-btc-muted text-xs font-medium">Already claimed today</p>
          <p className="text-btc-muted text-[10px] mt-1">Each address can claim once per day. Come back tomorrow!</p>
        </div>
      ) : (
        <p className="text-btc-muted text-xs text-center">
          Score <span className="text-btc-success font-bold">{score}</span>/100 — Claim{" "}
          <span className="text-btc-orange font-bold">
            {poolData ? Number(poolData.rewardAmountFormatted).toFixed(2) : "..."} SMILE
          </span>
        </p>
      )}

      <button
        onClick={handleClaim}
        disabled={!canClaim}
        className={`w-full py-2.5 px-6 rounded-xl font-bold text-btc-dark transition-all text-sm ${
          canClaim
            ? "bg-btc-orange hover:bg-btc-orange/90 shadow-md shadow-btc-orange/20"
            : "bg-btc-muted/20 text-btc-muted cursor-not-allowed"
        }`}
      >
        {isClaimPending ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="inline-block w-4 h-4 border-2 border-btc-dark border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Claiming...
          </span>
        ) : claimed ? (
          "✅ Claimed!"
        ) : poolInsufficient ? (
          "Pool Empty"
        ) : alreadyClaimedToday ? (
          "Come Back Tomorrow"
        ) : (
          "Claim Reward"
        )}
      </button>

      {lastTx && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full bg-btc-success/10 border border-btc-success/20 rounded-xl p-4 text-center"
        >
          <p className="text-btc-success text-sm font-medium mb-1">
            Transaction Confirmed! 🎉
          </p>
          <a
            href={lastTx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-btc-orange underline text-xs break-all hover:text-btc-orange/80"
          >
            View on Block Explorer →
          </a>
        </motion.div>
      )}

      {error && (
        <p className="text-btc-danger text-xs text-center">{decodeClaimError(error)}</p>
      )}
    </motion.div>
  );
}
