import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreMeterProps {
  score: number;
  isAnimating?: boolean;
}

export function ScoreMeter({ score, isAnimating = true }: ScoreMeterProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!isAnimating) {
      setDisplayScore(score);
      return;
    }
    setDisplayScore(0);
    const timer = setTimeout(() => setDisplayScore(score), 100);
    return () => clearTimeout(timer);
  }, [score, isAnimating]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;

  // Color interpolation: red → yellow → green
  const getColor = (s: number) => {
    if (s < 40) return "#FF5252";
    if (s < 60) return "#FFD740";
    if (s < 75) return "#FFC107";
    return "#00C853";
  };

  const color = getColor(displayScore);
  const isPassing = displayScore >= 75;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(33, 32, 28, 0.1)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-bold"
            style={{ color }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {displayScore}
          </motion.span>
          <span className="text-btc-muted text-sm">/ 100</span>
        </div>
      </div>

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className={`px-4 py-2 rounded-full text-sm font-semibold ${isPassing
            ? "bg-btc-success/20 text-btc-success border border-btc-success/30"
            : "bg-btc-danger/20 text-btc-danger border border-btc-danger/30"
          }`}
      >
        {isPassing ? "Eligible for Reward!" : "Keep Smiling! Need 75+"}
      </motion.div>
    </div>
  );
}
