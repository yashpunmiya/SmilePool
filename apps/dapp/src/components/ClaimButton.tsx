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
  onClaimSuccess?: (txHash: string, explorerUrl: string) => void;
}

export function ClaimButton({ score, message = "", onClaimSuccess }: ClaimButtonProps) {
  const { claimReward, isClaimPending, lastTx, error } = useSmilePool();
  const evmAddress = useEVMAddress();
  const { data: poolData, refetch } = usePoolBalance();
  const [claimed, setClaimed] = useState(false);
  const [alreadyClaimedToday, setAlreadyClaimedToday] = useState(false);

  // Check if user already claimed today (skip if they're whitelisted for unlimited claims)
  useEffect(() => {
    if (!evmAddress) return;
    // First check if this wallet is whitelisted for unlimited claims
    midlClient
      .readContract({
        address: smilePoolAddress,
        abi: smilePoolAbi,
        functionName: "unlimitedClaimers",
        args: [evmAddress as Address],
      })
      .then((isUnlimited) => {
        if (isUnlimited) {
          setAlreadyClaimedToday(false);
          return;
        }
        return midlClient
          .readContract({
            address: smilePoolAddress,
            abi: smilePoolAbi,
            functionName: "lastClaimDay",
            args: [evmAddress as Address],
          })
          .then((lastDay) => {
            const today = BigInt(Math.floor(Date.now() / 86400000));
            setAlreadyClaimedToday(BigInt(lastDay as bigint) === today);
          });
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

      // Save to feed via parent callback
      onClaimSuccess?.(result.txId, result.explorerUrl);

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-btc-success/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-btc-success to-btc-success/70 drop-shadow-sm z-10 flex items-center gap-2">
        <span className="text-2xl">🎉</span> You're Eligible!
      </h3>

      {poolInsufficient && !alreadyClaimedToday ? (
        <div className="bg-btc-amber/10 border border-btc-amber/20 rounded-2xl p-4 w-full text-center z-10">
          <p className="text-btc-amber text-sm font-bold">Pool is empty — no rewards yet</p>
          <p className="text-btc-muted/80 text-[11px] font-medium mt-1">
            Switch to "Fund" tab and donate SMILE Rune tokens to enable rewards.
          </p>
        </div>
      ) : alreadyClaimedToday ? (
        <div className="bg-black/5 border border-black/10 rounded-2xl p-4 w-full text-center z-10">
          <p className="text-btc-muted text-sm font-bold">Already claimed today</p>
          <p className="text-btc-muted/80 text-[11px] font-medium mt-1">Each address can claim once per day. Come back tomorrow!</p>
        </div>
      ) : (
        <div className="z-10 text-center">
          <p className="text-btc-text text-sm font-medium">
            Score <span className="text-btc-success font-black">{score}</span> / 100
          </p>
          <p className="text-btc-dark/70 mt-1 text-xs font-bold">Claim <span className="text-btc-orange font-black text-sm tracking-wide">{poolData ? Number(poolData.rewardAmountFormatted).toFixed(2) : "..."} SMILE</span></p>
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={!canClaim}
        className={`w-full py-3.5 px-6 rounded-2xl font-black transition-all duration-300 transform active:scale-95 text-base z-10 flex items-center justify-center gap-2 ${canClaim
          ? "bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white hover:brightness-110 shadow-xl shadow-btc-orange/30"
          : "bg-black/5 text-btc-muted/60 cursor-not-allowed border border-black/5"
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-btc-success/10 border border-btc-success/30 rounded-2xl p-4 text-center z-10"
        >
          <p className="text-btc-success text-sm font-bold mb-1.5 flex items-center justify-center gap-1">
            <span>🎉</span> Transaction Confirmed!
          </p>
          <a
            href={lastTx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-btc-orange font-medium text-xs break-all hover:text-btc-dark transition-colors underline decoration-btc-orange/30 underline-offset-2"
          >
            View on Explorer →
          </a>
        </motion.div>
      )}

      {error && (
        <p className="text-btc-danger text-xs text-center">{decodeClaimError(error)}</p>
      )}
    </motion.div>
  );
}
