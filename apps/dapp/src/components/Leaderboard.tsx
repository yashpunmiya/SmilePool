import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createPublicClient, http, type Address } from "viem";
import { SMILEPOOL_ADDRESS, MIDL_RPC } from "../config";
import { smilePoolAbi } from "../lib/contracts";

interface SmileEntry {
  smiler: `0x${string}`;
  score: bigint;
  timestamp: bigint;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<SmileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSmiles() {
      try {
        const client = createPublicClient({
          transport: http(MIDL_RPC),
        });

        const count = 20;
        const data = (await client.readContract({
          address: SMILEPOOL_ADDRESS as Address,
          abi: smilePoolAbi,
          functionName: "getRecentSmiles",
          args: [BigInt(count)],
        })) as readonly SmileEntry[];

        setEntries([...data]);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSmiles();
    const interval = setInterval(fetchSmiles, 15000);
    return () => clearInterval(interval);
  }, []);

  const truncateAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatTime = (ts: bigint) => {
    const date = new Date(Number(ts) * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-btc-card border border-btc-border p-6"
    >
      <h2 className="text-xl font-bold text-btc-orange flex items-center gap-2 mb-4">
        <span className="text-2xl">🏆</span> Recent Smiles
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <motion.div
            className="w-8 h-8 border-4 border-btc-orange border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-btc-muted text-4xl mb-2">😊</p>
          <p className="text-btc-muted text-sm">
            No smiles yet. Be the first to smile!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {entries.map((entry, i) => (
            <motion.div
              key={`${entry.smiler}-${entry.timestamp}-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl border transition-colors bg-btc-gray/50 border-btc-border/50"
            >
              {/* Rank */}
              <span className="text-lg w-8 text-center font-bold">
                {getMedal(i)}
              </span>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-btc-text text-sm font-mono truncate">
                  {truncateAddr(entry.smiler)}
                </p>
                <p className="text-btc-muted text-xs">
                  {formatTime(entry.timestamp)}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    Number(entry.score) >= 75
                      ? "text-btc-success"
                      : Number(entry.score) >= 50
                      ? "text-yellow-400"
                      : "text-btc-danger"
                  }`}
                >
                  {entry.score.toString()}
                </p>
                <p className="text-btc-muted text-xs">
                  Score: {entry.score.toString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
