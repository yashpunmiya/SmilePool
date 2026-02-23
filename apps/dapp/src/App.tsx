import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletConnect } from "./components/WalletConnect";
import { PoolStats } from "./components/PoolStats";
import { SmileCamera } from "./components/SmileCamera";
import { ClaimButton } from "./components/ClaimButton";
import { DonatePanel } from "./components/DonatePanel";
import { Leaderboard } from "./components/Leaderboard";
import { SmileFeed } from "./components/SmileFeed";
import { useAccounts } from "@midl/react";
import { useEVMAddress } from "@midl/executor-react";
import { uploadSmilePhoto, saveFeedEntry } from "./lib/smileStorage";

type Tab = "smile" | "donate" | "feed";

export default function App() {
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("smile");
  const { isConnected } = useAccounts();
  const evmAddress = useEVMAddress();
  // Keep the latest captured photo for saving to the feed after a successful claim
  const latestPhotoRef = useRef<string | null>(null);

  const handlePhotoReady = useCallback(
    (dataUrl: string, photoScore: number) => {
      // Store the captured image so we can save it to the feed after claim
      latestPhotoRef.current = dataUrl;
      if (!evmAddress) return;
      // fire-and-forget — update avatar
      uploadSmilePhoto(evmAddress, dataUrl, photoScore).catch(console.error);
    },
    [evmAddress]
  );

  /** Called by ClaimButton after a successful on-chain claim */
  const handleClaimSuccess = useCallback(
    (txHash: string, explorerUrl: string) => {
      if (!evmAddress || !latestPhotoRef.current || score === null) return;
      saveFeedEntry({
        evmAddress,
        dataUrl: latestPhotoRef.current,
        score,
        message,
        txHash,
        explorerUrl,
      }).catch(console.error);
    },
    [evmAddress, score, message]
  );

  return (
    <div className="min-h-screen font-sans bg-bg-color text-btc-text noise-bg overflow-x-hidden selection:bg-btc-orange/20">
      {/* Vibrant Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-btc-orange/30 rounded-full blur-[140px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[60%] bg-btc-amber/30 rounded-full blur-[160px] animate-pulse-slow" />
        <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-[#FFD740]/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-4">
        <div className="pointer-events-auto bg-white/80 backdrop-blur-3xl border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-full px-5 py-2.5 flex items-center justify-between w-full max-w-5xl transition-all">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-btc-orange to-[#FF7A00] p-2 shadow-lg shadow-btc-orange/30 flex items-center justify-center">
              <img src="/smile.svg" alt="SmilePool" className="w-[85%] h-[85%] object-contain filter drop-shadow-sm brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-xl font-black text-btc-dark tracking-tight leading-none">
                Smile<span className="text-btc-orange">Pool</span>
              </h1>
              <p className="text-[10px] text-btc-dark/80 font-black tracking-[0.2em] uppercase mt-0.5">Built on Midl</p>
            </div>
          </motion.div>
          <WalletConnect />
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-4 space-y-4">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="text-center space-y-2 py-0"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-btc-orange/10 border border-btc-orange/20 text-btc-orange text-xs font-black tracking-wide uppercase mb-0.5">
            AI Smile-to-Earn
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-btc-dark drop-shadow-sm pb-1">
            Smile & <span className="text-transparent bg-clip-text bg-gradient-to-r from-btc-orange to-[#FF7A00]">Earn SMILE</span>
          </h2>
          <p className="text-btc-dark text-sm font-bold max-w-lg mx-auto leading-relaxed">
            AI scores your smile. Score 75+ to claim <span className="text-btc-orange font-black">SMILE</span> Runes
            from the community pool. Spread positivity.
          </p>
        </motion.section>

        {/* Pool Stats */}
        <PoolStats />

        {/* Tab selector */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center pt-0"
          >
            <div className="flex bg-white/60 backdrop-blur-md rounded-full p-1.5 border border-black/10 shadow-inner">
              {([
                { key: "smile" as Tab, label: "Capture", emoji: "📸" },
                { key: "donate" as Tab, label: "Fund Pool", emoji: "💖" },
                { key: "feed" as Tab, label: "Live Feed", emoji: "🌟" },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out flex items-center gap-2 ${activeTab === t.key
                    ? "bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white shadow-lg shadow-btc-orange/30 scale-100"
                    : "text-btc-muted hover:text-btc-dark hover:bg-black/5 scale-95"
                    }`}
                >
                  <span className={activeTab === t.key ? "opacity-100" : "opacity-70"}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main content area */}
        {isConnected ? (
          <AnimatePresence mode="wait">
            {activeTab === "smile" ? (
              <motion.div
                key="smile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Camera */}
                  <SmileCamera onScoreReady={setScore} onPhotoReady={handlePhotoReady} />

                  {/* Claim panel */}
                  <div className="space-y-4">
                    {score !== null && score >= 75 && (
                      <>
                        {/* Message input */}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="rounded-[32px] glass-panel p-6 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-btc-orange/10 rounded-full blur-2xl -mr-10 -mt-10" />
                          <label className="text-btc-dark text-xs uppercase tracking-widest font-black mb-3 block flex items-center gap-2">
                            <span>✍️</span> Drop a message
                          </label>
                          <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                            placeholder="Spreading vibes! ✨"
                            className="w-full bg-white/80 border border-black/10 rounded-2xl px-4 py-3.5 text-sm text-btc-dark font-bold placeholder:text-btc-dark/50 focus:outline-none focus:border-btc-orange focus:ring-2 focus:ring-btc-orange/20 transition-all shadow-inner"
                            maxLength={140}
                          />
                          <p className="text-btc-dark/50 text-xs mt-2 text-right font-mono font-bold">
                            {message.length}/140
                          </p>
                        </motion.div>
                        <ClaimButton score={score} message={message} onClaimSuccess={handleClaimSuccess} />
                      </>
                    )}
                    {score !== null && score < 75 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="rounded-3xl bg-btc-danger/5 border border-btc-danger/20 p-6 text-center shadow-inner"
                      >
                        <p className="text-btc-danger text-base font-bold mb-1">
                          Score {score}/100
                        </p>
                        <p className="text-btc-danger/70 text-sm font-medium">Need 75+ to claim. Give us a bigger smile!</p>
                      </motion.div>
                    )}
                    {score === null && (
                      <div className="rounded-[32px] glass-panel border-dashed border-2 border-black/10 p-6 text-center flex flex-col items-center justify-center min-h-[200px]">
                        <motion.p
                          animate={{ rotate: [-5, 5, -5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-6xl mb-3 opacity-90"
                        >
                          🥺
                        </motion.p>
                        <p className="text-btc-dark font-black text-sm max-w-[200px]">
                          Waiting for your beautiful smile...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === "donate" ? (
              <motion.div
                key="donate"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="max-w-lg mx-auto"
              >
                <DonatePanel />
              </motion.div>
            ) : (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <SmileFeed />
                <Leaderboard />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-white border border-black/5 shadow-md flex items-center justify-center text-3xl">
              🔗
            </div>
            <div>
              <p className="text-btc-dark font-black text-lg">Connect your wallet</p>
              <p className="text-btc-dark/80 font-medium text-sm mt-1">
                Use Xverse wallet to start smiling & earning
              </p>
            </div>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </motion.div>
        )}

        {/* Leaderboard below content (except on feed tab where it IS the content) */}
        {activeTab !== "feed" && <Leaderboard />}

        {/* Footer */}
        <footer className="text-center pt-6 pb-6 border-t border-black/5 mt-6">
          <p className="text-btc-dark/80 text-sm font-bold">
            Built for{" "}
            <a
              href="https://midl.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-btc-orange hover:text-[#FF7A00] font-black transition-colors inline-flex items-center gap-1"
            >
              Midl ✧ VibeHack
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
