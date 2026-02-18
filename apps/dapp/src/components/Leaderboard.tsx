import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { SMILEPOOL_ADDRESS, MIDL_RPC, CHAIN_ID } from "../config";
import { smilePoolAbi } from "../lib/contracts";

const midlChain = {
  id: CHAIN_ID,
  name: "MIDL Regtest",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: [MIDL_RPC] } },
} as const;

interface SmileEntry {
  smiler: `0x${string}`;
  score: bigint;
  timestamp: bigint;
  reward: bigint;
  message: string;
}

interface TopSmiler {
  address: `0x${string}`;
  totalSmiles: bigint;
  bestScore: bigint;
  totalEarned: bigint;
}

type LeaderboardTab = "top" | "feed";

export function Leaderboard() {
  const [entries, setEntries] = useState<SmileEntry[]>([]);
  const [topSmilers, setTopSmilers] = useState<TopSmiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LeaderboardTab>("feed");

  useEffect(() => {
    async function fetchData() {
      try {
        const client = createPublicClient({
          chain: midlChain,
          transport: http(MIDL_RPC),
        });

        // Fetch recent smiles and top smilers in parallel
        const [recentData, topData] = await Promise.all([
          client.readContract({
            address: SMILEPOOL_ADDRESS as Address,
            abi: smilePoolAbi,
            functionName: "getRecentSmiles",
            args: [BigInt(20)],
          }),
          client.readContract({
            address: SMILEPOOL_ADDRESS as Address,
            abi: smilePoolAbi,
            functionName: "getTopSmilers",
            args: [BigInt(10)],
          }),
        ]);

        setEntries([...(recentData as readonly SmileEntry[])]);

        // getTopSmilers returns 4 parallel arrays
        const [addresses, bestScores, totalSmiles, totalEarned] = topData as readonly [
          readonly `0x${string}`[],
          readonly bigint[],
          readonly bigint[],
          readonly bigint[],
        ];

        const smilers: TopSmiler[] = addresses
          .map((addr, i) => ({
            address: addr,
            totalSmiles: totalSmiles[i],
            bestScore: bestScores[i],
            totalEarned: totalEarned[i],
          }))
          .filter((s) => s.address !== "0x0000000000000000000000000000000000000000");

        setTopSmilers(smilers);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15000);
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
      className="rounded-2xl bg-btc-card/80 border border-btc-border/50 p-5"
    >
      {/* Tab header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-btc-text flex items-center gap-2">
          <span className="text-xl">🏆</span> Leaderboard
        </h2>
        <div className="flex gap-0.5 bg-btc-gray/80 rounded-lg p-0.5">
          <button
            onClick={() => setTab("feed")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              tab === "feed"
                ? "bg-btc-orange text-btc-dark"
                : "text-btc-muted hover:text-btc-text"
            }`}
          >
            Recent Feed
          </button>
          <button
            onClick={() => setTab("top")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              tab === "top"
                ? "bg-btc-orange text-btc-dark"
                : "text-btc-muted hover:text-btc-text"
            }`}
          >
            Top Smilers
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <motion.div
            className="w-8 h-8 border-4 border-btc-orange border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : tab === "feed" ? (
        /* Recent Smiles Feed */
        entries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {entries.map((entry, i) => (
              <motion.div
                key={`${entry.smiler}-${entry.timestamp}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-xl border bg-btc-gray/50 border-btc-border/50"
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span className="text-lg w-8 text-center font-bold">
                    {getMedal(i)}
                  </span>

                  {/* User + message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-btc-text text-sm font-mono truncate">
                      {truncateAddr(entry.smiler)}
                    </p>
                    <p className="text-btc-muted text-xs">
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>

                  {/* Score + Reward */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-lg font-bold ${
                        Number(entry.score) >= 90
                          ? "text-btc-success"
                          : Number(entry.score) >= 75
                          ? "text-yellow-400"
                          : "text-btc-muted"
                      }`}
                    >
                      {entry.score.toString()}
                    </p>
                    <p className="text-btc-orange text-xs font-medium">
                      +{Number(formatUnits(entry.reward, 18)).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Message */}
                {entry.message && (
                  <p className="mt-2 ml-11 text-sm text-btc-text/80 italic border-l-2 border-btc-orange/30 pl-3">
                    "{entry.message}"
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* Top Smilers */
        topSmilers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {topSmilers.map((smiler, i) => (
              <motion.div
                key={smiler.address}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl border bg-btc-gray/50 border-btc-border/50"
              >
                <span className="text-lg w-8 text-center font-bold">
                  {getMedal(i)}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-btc-text text-sm font-mono truncate">
                    {truncateAddr(smiler.address)}
                  </p>
                  <p className="text-btc-muted text-xs">
                    {smiler.totalSmiles.toString()} smiles · Best: {smiler.bestScore.toString()}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-btc-orange text-lg font-bold">
                    {Number(formatUnits(smiler.totalEarned, 18)).toFixed(2)}
                  </p>
                  <p className="text-btc-muted text-xs">SMILES earned</p>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <p className="text-btc-muted text-4xl mb-2">😊</p>
      <p className="text-btc-muted text-sm">
        No smiles yet. Be the first to smile!
      </p>
    </div>
  );
}
