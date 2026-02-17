import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletConnect } from "./components/WalletConnect";
import { PoolStats } from "./components/PoolStats";
import { SmileCamera } from "./components/SmileCamera";
import { ScoreMeter } from "./components/ScoreMeter";
import { ClaimButton } from "./components/ClaimButton";
import { DonatePanel } from "./components/DonatePanel";
import { Leaderboard } from "./components/Leaderboard";
import { useAccounts } from "@midl/react";

type Tab = "smile" | "donate" | "feed";

export default function App() {
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("smile");
  const { isConnected } = useAccounts();

  return (
    <div className="min-h-screen bg-btc-dark text-btc-text">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-btc-orange/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[60%] bg-btc-orange/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-btc-border/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/smile.svg" alt="SmilePool" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-btc-orange tracking-tight">
                SmilePool
              </h1>
              <p className="text-xs text-btc-muted">Smile-to-Earn on Bitcoin</p>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 py-6"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            Smile & <span className="text-btc-orange">Earn Bitcoin</span>
          </h2>
          <p className="text-btc-muted text-lg max-w-xl mx-auto">
            Take a selfie, let AI score your smile, and claim SMILES Rune tokens
            from the community pool. Powered by Midl Protocol.
          </p>
        </motion.section>

        {/* Pool Stats */}
        <PoolStats />

        {/* Tab selector */}
        {isConnected && (
          <div className="flex items-center justify-center gap-2">
            {(["smile", "donate", "feed"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2 rounded-xl font-medium text-sm transition-all ${
                  activeTab === t
                    ? "bg-btc-orange text-btc-dark shadow-lg shadow-btc-orange/20"
                    : "bg-btc-card border border-btc-border text-btc-muted hover:text-btc-text"
                }`}
              >
                {t === "smile" ? "😊 Smile & Earn" : t === "donate" ? "💰 Fund Pool" : "🏆 Feed"}
              </button>
            ))}
          </div>
        )}

        {/* Main content area */}
        {isConnected ? (
          <AnimatePresence mode="wait">
            {activeTab === "smile" ? (
              <motion.div
                key="smile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {/* Left: Camera */}
                <div className="space-y-4">
                  <SmileCamera onScoreReady={setScore} />
                </div>

                {/* Right: Score + Message + Claim */}
                <div className="space-y-4">
                  {score !== null && (
                    <>
                      <ScoreMeter score={score} />

                      {/* Message input */}
                      {score >= 75 && (
                        <div className="rounded-2xl bg-btc-card border border-btc-border p-4">
                          <label className="text-btc-muted text-xs uppercase tracking-wider font-medium mb-2 block">
                            Add a message (optional)
                          </label>
                          <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                            placeholder="Spreading positivity on Bitcoin! ☀️"
                            className="w-full bg-btc-gray border border-btc-border rounded-xl px-4 py-2.5 text-sm text-btc-text placeholder:text-btc-muted/50 focus:outline-none focus:border-btc-orange/50"
                            maxLength={140}
                          />
                          <p className="text-btc-muted/50 text-xs mt-1 text-right">
                            {message.length}/140
                          </p>
                        </div>
                      )}

                      <ClaimButton score={score} message={message} />
                    </>
                  )}
                  {score === null && (
                    <div className="rounded-2xl bg-btc-card border border-btc-border p-8 text-center">
                      <p className="text-btc-muted text-5xl mb-4">📸</p>
                      <p className="text-btc-muted">
                        Take a selfie or upload a photo to get your smile score!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === "donate" ? (
              <motion.div
                key="donate"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="max-w-lg mx-auto"
              >
                <DonatePanel />
              </motion.div>
            ) : (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Leaderboard />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-4"
          >
            <p className="text-btc-muted text-6xl">🔗</p>
            <p className="text-btc-muted text-lg">
              Connect your Bitcoin wallet to start smiling!
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </motion.div>
        )}

        {/* Show leaderboard on smile/donate tabs too, below main content */}
        {isConnected && activeTab !== "feed" && (
          <Leaderboard />
        )}

        {/* Always show leaderboard when not connected */}
        {!isConnected && <Leaderboard />}

        {/* Footer */}
        <footer className="text-center py-6 border-t border-btc-border/50">
          <p className="text-btc-muted text-sm">
            Built with ❤️ for{" "}
            <a
              href="https://midl.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-btc-orange hover:underline"
            >
              Midl VibeHack
            </a>
          </p>
          <p className="text-btc-muted/60 text-xs mt-1">
            SmilePool — AI-powered Smile-to-Earn on Bitcoin
          </p>
        </footer>
      </main>
    </div>
  );
}
