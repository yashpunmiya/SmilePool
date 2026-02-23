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

interface DonorRecord {
  donor: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
}

interface AggregatedDonor {
  address: `0x${string}`;
  totalDonated: bigint;
  donationCount: number;
  lastDonation: bigint;
}

type DonorTab = "top" | "recent";

const getMedal = (index: number) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
};

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

export function DonorsLeaderboard() {
  const [recentDonations, setRecentDonations] = useState<DonorRecord[]>([]);
  const [topDonors, setTopDonors] = useState<AggregatedDonor[]>([]);
  const [totalDonated, setTotalDonated] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DonorTab>("top");

  useEffect(() => {
    async function fetchData() {
      try {
        const client = createPublicClient({
          chain: midlChain,
          transport: http(MIDL_RPC),
        });

        const [donations, total] = await Promise.all([
          client.readContract({
            address: SMILEPOOL_ADDRESS as Address,
            abi: smilePoolAbi,
            functionName: "getRecentDonations",
            args: [BigInt(50)],
          }),
          client.readContract({
            address: SMILEPOOL_ADDRESS as Address,
            abi: smilePoolAbi,
            functionName: "totalDonated",
            args: [],
          }),
        ]);

        const records = [...(donations as readonly DonorRecord[])];
        setRecentDonations(records);
        setTotalDonated(total as bigint);

        // Aggregate by donor address
        const map = new Map<string, AggregatedDonor>();
        for (const r of records) {
          const key = r.donor.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.totalDonated += r.amount;
            existing.donationCount += 1;
            if (r.timestamp > existing.lastDonation) {
              existing.lastDonation = r.timestamp;
            }
          } else {
            map.set(key, {
              address: r.donor,
              totalDonated: r.amount,
              donationCount: 1,
              lastDonation: r.timestamp,
            });
          }
        }

        const sorted = Array.from(map.values()).sort(
          (a, b) => (b.totalDonated > a.totalDonated ? 1 : -1)
        );
        setTopDonors(sorted);
      } catch (err) {
        console.error("Failed to fetch donors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-btc-orange/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-1 z-10 w-full">
        <div>
          <h2 className="text-xl font-black text-btc-dark flex items-center gap-2 drop-shadow-sm">
            <span className="text-2xl drop-shadow-md">💰</span> Top Donors
          </h2>
          {totalDonated > BigInt(0) && (
            <p className="text-btc-dark/50 text-xs font-bold mt-0.5">
              {Number(formatUnits(totalDonated, 18)).toLocaleString()} SMILE pooled total
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-black/5 backdrop-blur-md rounded-xl p-1 shadow-inner border border-black/5">
          <button
            onClick={() => setTab("top")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "top"
                ? "bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white shadow-md"
                : "text-btc-dark/60 hover:text-btc-dark"
            }`}
          >
            Top Donors
          </button>
          <button
            onClick={() => setTab("recent")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "recent"
                ? "bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white shadow-md"
                : "text-btc-dark/60 hover:text-btc-dark"
            }`}
          >
            Recent
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
      ) : tab === "top" ? (
        topDonors.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar z-10 w-full relative">
            {topDonors.map((donor, i) => (
              <motion.div
                key={donor.address}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-black/5 hover:border-btc-orange/30 hover:bg-white transition-colors shadow-sm"
              >
                <span className="text-2xl w-8 text-center font-bold drop-shadow-sm flex-shrink-0">
                  {getMedal(i)}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-btc-dark text-sm font-mono font-bold truncate">
                    {truncateAddr(donor.address)}
                  </p>
                  <p className="text-btc-dark/60 text-[11px] font-bold mt-0.5">
                    {donor.donationCount} donation{donor.donationCount !== 1 ? "s" : ""}
                    {" · "}last {formatTime(donor.lastDonation)}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-btc-orange text-lg font-black">
                    {Number(formatUnits(donor.totalDonated, 18)).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-btc-dark/60 font-bold text-xs">SMILE donated</p>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* Recent Donations */
        recentDonations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar z-10 w-full relative">
            {[...recentDonations]
              .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
              .map((record, i) => (
                <motion.div
                  key={`${record.donor}-${record.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-black/5 hover:border-btc-orange/30 hover:bg-white transition-colors shadow-sm"
                >
                  <span className="text-xl w-8 text-center flex-shrink-0">💎</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-btc-dark text-sm font-mono font-bold truncate">
                      {truncateAddr(record.donor)}
                    </p>
                    <p className="text-btc-dark/60 text-[11px] font-bold mt-0.5">
                      {formatTime(record.timestamp)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-btc-orange text-lg font-black">
                      +{Number(formatUnits(record.amount, 18)).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-btc-dark/60 font-bold text-xs">SMILE</p>
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
      <p className="text-btc-muted text-4xl mb-2">💸</p>
      <p className="text-btc-muted text-sm">
        No donations yet. Be the first donor!
      </p>
    </div>
  );
}
