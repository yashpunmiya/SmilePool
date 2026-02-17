import { motion } from "framer-motion";
import { useSmilePool } from "../hooks/useSmilePool";
import { usePoolBalance } from "../hooks/usePoolBalance";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

interface ClaimButtonProps {
  score: number | null;
}

export function ClaimButton({ score }: ClaimButtonProps) {
  const { claimReward, isClaimPending, lastTx, error } = useSmilePool();
  const { data: poolData, refetch } = usePoolBalance();
  const [claimed, setClaimed] = useState(false);

  const canClaim = score !== null && score >= 75 && !isClaimPending && !claimed;

  const handleClaim = async () => {
    if (!canClaim || score === null) return;

    const result = await claimReward(score);
    if (result) {
      setClaimed(true);
      refetch();

      // Confetti burst!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#F7931A", "#FFD740", "#00C853", "#FF5252"],
      });
    }
  };

  // Reset claimed state when score changes
  useEffect(() => {
    setClaimed(false);
  }, [score]);

  if (score === null || score < 75) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-btc-orange/10 to-btc-card border border-btc-orange/30 p-6 flex flex-col items-center gap-4"
    >
      <h3 className="text-lg font-bold text-btc-orange">
        🎉 You're Eligible!
      </h3>
      <p className="text-btc-muted text-sm text-center">
        Your smile scored <span className="text-btc-success font-bold">{score}</span>/100!
        Claim your reward of{" "}
        <span className="text-btc-orange font-bold">
          {poolData ? Number(poolData.rewardAmountFormatted).toFixed(2) : "..."}{" "}
          tokens
        </span>{" "}
        from the pool.
      </p>

      <button
        onClick={handleClaim}
        disabled={!canClaim}
        className={`w-full py-3 px-6 rounded-xl font-bold text-btc-dark transition-all text-sm ${
          canClaim
            ? "bg-btc-orange hover:bg-btc-orange/90 shadow-lg shadow-btc-orange/20 hover:shadow-btc-orange/40"
            : "bg-btc-muted/30 text-btc-muted cursor-not-allowed"
        }`}
      >
        {isClaimPending ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="inline-block w-4 h-4 border-2 border-btc-dark border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Claiming... Sign in Xverse
          </span>
        ) : claimed ? (
          "✅ Reward Claimed!"
        ) : (
          "😊 Claim Reward"
        )}
      </button>

      {/* TX confirmation */}
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
