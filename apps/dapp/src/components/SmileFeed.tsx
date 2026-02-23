import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRecentFeedEntries, type FeedEntry } from "../lib/smileStorage";
import { EXPLORER_URL } from "../config";

function truncateAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: string | null): string {
  if (!ts) return "just now";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-btc-success";
  if (score >= 80) return "text-yellow-300";
  return "text-btc-orange";
}

function scoreBorder(score: number): string {
  if (score >= 90) return "border-btc-success/40";
  if (score >= 80) return "border-yellow-400/40";
  return "border-btc-orange/40";
}

export function SmileFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await getRecentFeedEntries(30);
      setEntries(data);
    } catch (err) {
      console.error("Feed fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 15_000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-btc-text flex items-center gap-2">
          <span className="text-xl">📸</span> Smile Feed
        </h2>
        <button
          onClick={() => {
            setLoading(true);
            fetchFeed();
          }}
          className="text-btc-muted hover:text-btc-orange text-xs transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && entries.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="w-8 h-8 border-4 border-btc-orange border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 rounded-2xl bg-btc-card/60 border border-btc-border/30 border-dashed"
        >
          <p className="text-4xl mb-3">😊</p>
          <p className="text-btc-muted text-sm font-medium">
            No smiles in the feed yet
          </p>
          <p className="text-btc-muted/60 text-xs mt-1">
            Score 75+ and claim a reward to show up here!
          </p>
        </motion.div>
      )}

      {/* Photo grid */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              onClick={() => setSelectedEntry(entry)}
              className={`group relative cursor-pointer rounded-xl overflow-hidden border ${scoreBorder(
                entry.score
              )} bg-btc-card/80 hover:border-btc-orange/60 transition-all hover:shadow-lg hover:shadow-btc-orange/10`}
            >
              {/* Image */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={entry.photoUrl}
                  alt={`Smile by ${truncateAddr(entry.evmAddress)}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Overlay with score badge */}
              <div className="absolute top-2 right-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-btc-dark/80 backdrop-blur-sm border border-btc-border/40 ${scoreColor(
                    entry.score
                  )}`}
                >
                  {entry.score}
                </span>
              </div>

              {/* Bottom info */}
              <div className="p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-btc-text text-[11px] font-mono truncate">
                    {truncateAddr(entry.evmAddress)}
                  </p>
                  <p className="text-btc-muted text-[10px] flex-shrink-0 ml-1">
                    {timeAgo(entry.createdAt)}
                  </p>
                </div>
                {entry.message && (
                  <p className="text-btc-muted text-[10px] truncate italic">
                    "{entry.message}"
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-2xl bg-btc-card border border-btc-border/60 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-btc-dark/80 backdrop-blur-sm border border-btc-border/40 flex items-center justify-center text-btc-muted hover:text-btc-text transition-colors"
              >
                ✕
              </button>

              {/* Image */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={selectedEntry.photoUrl}
                  alt="Smile"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-btc-text text-sm font-mono">
                      {truncateAddr(selectedEntry.evmAddress)}
                    </p>
                    <p className="text-btc-muted text-xs">
                      {timeAgo(selectedEntry.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-3xl font-bold ${scoreColor(
                        selectedEntry.score
                      )}`}
                    >
                      {selectedEntry.score}
                    </p>
                    <p className="text-btc-muted text-[10px] uppercase tracking-wider">
                      Score
                    </p>
                  </div>
                </div>

                {selectedEntry.message && (
                  <p className="text-btc-text/80 text-sm italic border-l-2 border-btc-orange/30 pl-3">
                    "{selectedEntry.message}"
                  </p>
                )}

                {/* Tx link */}
                <a
                  href={
                    selectedEntry.explorerUrl ||
                    `${EXPLORER_URL}/tx/${selectedEntry.txHash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-btc-orange hover:text-btc-orange/80 text-xs transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View transaction on explorer
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
