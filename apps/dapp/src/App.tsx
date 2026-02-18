import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletConnect } from "./components/WalletConnect";
import { PoolStats } from "./components/PoolStats";
import { SmileCamera } from "./components/SmileCamera";
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
    <div className="min-h-screen bg-btc-dark text-btc-text noise-bg">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-40%] left-[-15%] w-[70%] h-[70%] bg-btc-orange/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[50%] h-[50%] bg-purple-500/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-btc-border/40 bg-btc-dark/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/smile.svg" alt="SmilePool" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold text-btc-text tracking-tight leading-tight">
                Smile<span className="text-btc-orange">Pool</span>
              </h1>
              <p className="text-[10px] text-btc-muted font-medium tracking-widest uppercase">Smile-to-Earn on Bitcoin</p>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 py-4"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Smile & <span className="text-btc-orange">Earn SMILES</span>
          </h2>
          <p className="text-btc-muted text-sm max-w-md mx-auto leading-relaxed">
            AI scores your smile. Score 75+ to claim SMILES Rune tokens
            from the community pool. Built on Midl Protocol.
          </p>
        </motion.section>

        {/* Pool Stats */}
        <PoolStats />

        {/* Tab selector */}
        {isConnected && (
          <div className="flex items-center justify-center">
            <div className="flex bg-btc-gray/80 rounded-xl p-1 border border-btc-border/50">
              {([
                { key: "smile" as Tab, label: "😊 Smile", icon: "" },
                { key: "donate" as Tab, label: "💰 Fund", icon: "" },
                { key: "feed" as Tab, label: "🏆 Feed", icon: "" },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`relative px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === t.key
                      ? "bg-btc-orange text-btc-dark shadow-md"
                      : "text-btc-muted hover:text-btc-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
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
                className="space-y-5"
              >
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Camera */}
                  <SmileCamera onScoreReady={setScore} />

                  {/* Claim panel */}
                  <div className="space-y-4">
                    {score !== null && score >= 75 && (
                      <>
                        {/* Message input */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-btc-card/80 border border-btc-border/50 p-4"
                        >
                          <label className="text-btc-muted text-[10px] uppercase tracking-widest font-semibold mb-2 block">
                            Add a message (optional)
                          </label>
                          <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                            placeholder="Spreading positivity on Bitcoin! ☀️"
                            className="w-full bg-btc-gray/60 border border-btc-border/40 rounded-lg px-3 py-2 text-sm text-btc-text placeholder:text-btc-muted/40 focus:outline-none focus:border-btc-orange/40 transition-colors"
                            maxLength={140}
                          />
                          <p className="text-btc-muted/40 text-[10px] mt-1 text-right font-mono">
                            {message.length}/140
                          </p>
                        </motion.div>
                        <ClaimButton score={score} message={message} />
                      </>
                    )}
                    {score !== null && score < 75 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-btc-card/80 border border-btc-border/50 p-6 text-center"
                      >
                        <p className="text-btc-danger text-sm font-medium">
                          Score {score}/100 — Need 75+ to claim
                        </p>
                        <p className="text-btc-muted text-xs mt-1">Try again with a bigger smile!</p>
                      </motion.div>
                    )}
                    {score === null && (
                      <div className="rounded-2xl bg-btc-card/60 border border-btc-border/30 border-dashed p-8 text-center">
                        <p className="text-btc-muted text-3xl mb-3">📸</p>
                        <p className="text-btc-muted text-sm">
                          Take a selfie or upload a photo to get started
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
              >
                <Leaderboard />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-5"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-btc-gray border border-btc-border flex items-center justify-center text-3xl">
              🔗
            </div>
            <div>
              <p className="text-btc-text font-semibold">Connect your wallet</p>
              <p className="text-btc-muted text-sm mt-1">
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
        <footer className="text-center py-6 border-t border-btc-border/30">
          <p className="text-btc-muted text-xs">
            Built for{" "}
            <a
              href="https://midl.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-btc-orange hover:underline font-medium"
            >
              Midl VibeHack
            </a>
            {" "}· SmilePool — AI Smile-to-Earn on Bitcoin
          </p>
        </footer>
      </main>
    </div>
  );
}
