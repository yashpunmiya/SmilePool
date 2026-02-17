import { useState } from "react";
import { motion } from "framer-motion";
import { useSmilePool } from "../hooks/useSmilePool";
import { usePoolBalance } from "../hooks/usePoolBalance";
import { useAccounts, useRunes } from "@midl/react";
import { useERC20Rune } from "@midl/executor-react";
import { parseUnits } from "viem";

export function DonatePanel() {
  const [amount, setAmount] = useState("");
  const [selectedRuneId, setSelectedRuneId] = useState<string>("");
  const { donate, isDonatePending, lastTx, error } = useSmilePool();
  const { refetch } = usePoolBalance();

  // Get user's runes
  const { paymentAccount } = useAccounts();
  const address = paymentAccount?.address || "";
  const { runes } = useRunes({ address });

  // Get ERC20 address for selected rune  
  const { erc20Address } = useERC20Rune(selectedRuneId || "0:0");
  const runeAssetAddress = erc20Address?.[0];

  const handleDonate = async () => {
    if (!amount || !selectedRuneId || !runeAssetAddress) return;

    const amountWei = parseUnits(amount, 18);
    const result = await donate(
      amountWei,
      runeAssetAddress,
      selectedRuneId
    );

    if (result) {
      setAmount("");
      refetch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-btc-card border border-btc-border p-6 flex flex-col gap-4"
    >
      <h2 className="text-xl font-bold text-btc-orange flex items-center gap-2">
        <span className="text-2xl">💰</span> Fund the Pool
      </h2>
      <p className="text-btc-muted text-sm">
        Donate Rune tokens to fill the SmilePool reward pool. Your donation helps
        reward smilers around the world!
      </p>

      {/* Rune selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-btc-muted uppercase tracking-wider font-medium">
          Select Rune
        </label>
        <select
          value={selectedRuneId}
          onChange={(e) => setSelectedRuneId(e.target.value)}
          className="w-full py-2.5 px-4 rounded-xl bg-btc-gray border border-btc-border text-btc-text text-sm focus:outline-none focus:border-btc-orange transition-colors"
        >
          <option value="">Choose a rune...</option>
          {(runes as any)?.map?.((rune: any) => (
            <option key={rune.id} value={rune.id}>
              {rune.name || rune.id} — Balance: {rune.balance?.toString() || "0"}
            </option>
          ))}
        </select>
      </div>

      {/* Amount input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-btc-muted uppercase tracking-wider font-medium">
          Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          min="0"
          step="1"
          className="w-full py-2.5 px-4 rounded-xl bg-btc-gray border border-btc-border text-btc-text text-sm focus:outline-none focus:border-btc-orange transition-colors placeholder:text-btc-muted/50"
        />
      </div>

      <button
        onClick={handleDonate}
        disabled={!amount || !selectedRuneId || !runeAssetAddress || isDonatePending}
        className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all ${
          amount && selectedRuneId && !isDonatePending
            ? "bg-btc-orange text-btc-dark hover:bg-btc-orange/90 shadow-lg shadow-btc-orange/20"
            : "bg-btc-muted/30 text-btc-muted cursor-not-allowed"
        }`}
      >
        {isDonatePending ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="inline-block w-4 h-4 border-2 border-btc-dark border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Donating... Sign in Xverse
          </span>
        ) : (
          "💰 Fund the Pool"
        )}
      </button>

      {/* TX confirmation */}
      {lastTx && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-btc-success/10 border border-btc-success/20 rounded-xl p-4 text-center"
        >
          <p className="text-btc-success text-sm font-medium mb-1">
            Donation Confirmed! 💰
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
