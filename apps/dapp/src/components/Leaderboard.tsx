import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { SMILEPOOL_ADDRESS, MIDL_RPC, CHAIN_ID } from "../config";
import { smilePoolAbi } from "../lib/contracts";
import { useSmilePhotos } from "../hooks/useSmilePhotos";

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

  // Collect all unique addresses for photo lookup
  const feedAddresses = entries.map((e) => e.smiler);
  const topAddresses = topSmilers.map((s) => s.address);
  const allAddresses = [...new Set([...feedAddresses, ...topAddresses])];
  const photos = useSmilePhotos(allAddresses);

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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-btc-orange/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      {/* Tab header */}
      <div className="flex items-center justify-between mb-2 z-10 w-full">
        <h2 className="text-xl font-black text-btc-dark flex items-center gap-2 drop-shadow-sm">
          <span className="text-2xl drop-shadow-md">🏆</span> Leaderboard
        </h2>
        <div className="flex gap-1 bg-black/5 backdrop-blur-md rounded-xl p-1 shadow-inner border border-black/5">
          <button
            onClick={() => setTab("feed")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "feed"
              ? "bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white shadow-md"
              : "text-btc-dark/60 hover:text-btc-dark"
              }`}
          >
            Recent Feed
          </button>
          <button
            onClick={() => setTab("top")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "top"
              ? "bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white shadow-md"
              : "text-btc-dark/60 hover:text-btc-dark"
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
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar z-10 w-full relative">
            {entries.map((entry, i) => (
              <motion.div
                key={`${entry.smiler}-${entry.timestamp}-${i}`}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-2xl bg-white/60 border border-black/5 hover:border-btc-orange/30 hover:bg-white transition-colors shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* Photo avatar or rank */}
                  {photos[entry.smiler.toLowerCase()] ? (
                    <img
                      src={photos[entry.smiler.toLowerCase()]}
                      alt="smile"
                      className="w-12 h-12 rounded-full object-cover border-2 border-btc-orange/50 shadow-md flex-shrink-0"
                    />
                  ) : (
                    <span className="text-xl w-12 text-center font-bold drop-shadow-md flex-shrink-0">
                      {getMedal(i)}
                    </span>
                  )}

                  {/* User + message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-btc-dark text-sm font-mono font-bold truncate">
                      {truncateAddr(entry.smiler)}
                    </p>
                    <p className="text-btc-dark/70 text-[11px] font-bold mt-0.5">
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>

                  {/* Score + Reward */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-2xl font-black drop-shadow-sm ${Number(entry.score) >= 90
                        ? "text-btc-success"
                        : Number(entry.score) >= 75
                          ? "text-btc-amber"
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
                  <p className="mt-2 ml-14 text-sm text-btc-dark font-medium italic border-l-2 border-btc-orange/50 pl-3">
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
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar z-10 w-full relative">
            {topSmilers.map((smiler, i) => (
              <motion.div
                key={smiler.address}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-black/5 hover:border-btc-orange/30 hover:bg-white transition-colors shadow-sm"
              >
                <span className="text-2xl w-8 text-center font-bold drop-shadow-sm">
                  {getMedal(i)}
                </span>

                {/* Photo avatar */}
                {photos[smiler.address.toLowerCase()] && (
                  <img
                    src={photos[smiler.address.toLowerCase()]}
                    alt="smile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-btc-orange/50 shadow-md flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-btc-dark text-sm font-mono font-bold truncate">
                    {truncateAddr(smiler.address)}
                  </p>
                  <p className="text-btc-dark/70 text-[11px] font-bold mt-0.5">
                    {smiler.totalSmiles.toString()} smiles · Best: <span className="text-btc-success">{smiler.bestScore.toString()}</span>
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-btc-orange text-lg font-black">
                    {Number(formatUnits(smiler.totalEarned, 18)).toFixed(2)}
                  </p>
                  <p className="text-btc-dark/60 font-bold text-xs">SMILE earned</p>
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
