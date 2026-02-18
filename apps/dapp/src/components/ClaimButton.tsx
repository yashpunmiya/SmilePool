import { motion } from "framer-motion";
import { useSmilePool, useEVMAddress } from "../hooks/useSmilePool";
import { usePoolBalance } from "../hooks/usePoolBalance";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

interface ClaimButtonProps {
  score: number | null;
  message?: string;
}

export function ClaimButton({ score, message = "" }: ClaimButtonProps) {
  const { claimReward, isClaimPending, lastTx, error } = useSmilePool();
  const evmAddress = useEVMAddress();
  const { data: poolData, refetch } = usePoolBalance();
  const [claimed, setClaimed] = useState(false);

  const poolEmpty = poolData ? poolData.poolBalance === 0n : false;
  const canClaim = score !== null && score >= 75 && !isClaimPending && !claimed && !poolEmpty;

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

      {poolEmpty ? (
        <div className="bg-btc-amber/10 border border-btc-amber/20 rounded-xl p-3 w-full text-center">
          <p className="text-btc-amber text-xs font-medium">Pool is empty — no rewards yet</p>
          <p className="text-btc-muted text-[10px] mt-1">
            Switch to "Fund" tab and donate SMILES Rune tokens to enable rewards.
          </p>
        </div>
      ) : (
        <p className="text-btc-muted text-xs text-center">
          Score <span className="text-btc-success font-bold">{score}</span>/100 — Claim{" "}
          <span className="text-btc-orange font-bold">
            {poolData ? Number(poolData.rewardAmountFormatted).toFixed(2) : "..."} SMILES
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
        ) : poolEmpty ? (
          "Pool Empty"
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
        <p className="text-btc-danger text-xs text-center">{error}</p>
      )}
    </motion.div>
  );
}
