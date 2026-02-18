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
      className="rounded-2xl bg-btc-card/80 border border-btc-border/50 p-5 flex flex-col gap-4"
    >
      <h2 className="text-base font-bold text-btc-text flex items-center gap-2">
        <span className="text-xl">💰</span> Fund the Pool
      </h2>
      <p className="text-btc-muted text-xs leading-relaxed">
        Donate Rune tokens to fill the SmilePool reward pool. Help reward smilers around the world.
      </p>

      {/* Rune selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-btc-muted uppercase tracking-widest font-semibold">
          Select Rune
        </label>
        <select
          value={selectedRuneId}
          onChange={(e) => setSelectedRuneId(e.target.value)}
          className="w-full py-2 px-3 rounded-lg bg-btc-gray/60 border border-btc-border/40 text-btc-text text-sm focus:outline-none focus:border-btc-orange/40 transition-colors"
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
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-btc-muted uppercase tracking-widest font-semibold">
          Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          min="0"
          step="1"
          className="w-full py-2 px-3 rounded-lg bg-btc-gray/60 border border-btc-border/40 text-btc-text text-sm focus:outline-none focus:border-btc-orange/40 transition-colors placeholder:text-btc-muted/40"
        />
      </div>

      <button
        onClick={handleDonate}
        disabled={!amount || !selectedRuneId || !runeAssetAddress || isDonatePending}
        className={`w-full py-2.5 px-6 rounded-xl font-bold text-sm transition-all ${
          amount && selectedRuneId && !isDonatePending
            ? "bg-btc-orange text-btc-dark hover:bg-btc-orange/90 shadow-md shadow-btc-orange/20"
            : "bg-btc-muted/20 text-btc-muted cursor-not-allowed"
        }`}
      >
        {isDonatePending ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="inline-block w-4 h-4 border-2 border-btc-dark border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Donating...
          </span>
        ) : (
          "Fund the Pool"
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
