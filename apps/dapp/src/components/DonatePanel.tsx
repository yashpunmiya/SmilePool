import { useState } from "react";
import { motion } from "framer-motion";
import { useSmilePool } from "../hooks/useSmilePool";
import { usePoolBalance } from "../hooks/usePoolBalance";
import { useRunes } from "@midl/react";
import { getCreate2RuneAddress } from "@midl/executor";
import { parseUnits } from "viem";

const WEI = BigInt(1e18);

type RuneEntry = {
  rune: { id: string; name: string; spaced_name: string; number?: number };
  address: string;
  balance: bigint | string;
};

// Maestro returns balances scaled by 1e18; convert to whole rune units for display
function formatRuneBalance(raw: bigint | string): string {
  try {
    return (BigInt(raw.toString()) / WEI).toString();
  } catch {
    return "0";
  }
}

export function DonatePanel() {
  const [amount, setAmount] = useState("");
  const [selectedRune, setSelectedRune] = useState<RuneEntry | null>(null);
  const { donate, isDonatePending, lastTx, error } = useSmilePool();
  const { refetch } = usePoolBalance();

  // Get user's runes — useRunes auto-uses ordinalsAccount when no address given
  const { runes, isLoading: runesLoading } = useRunes({});

  // Derive the ERC20 contract address deterministically from the rune ID (not the holder's BTC address)
  const runeERC20Address = selectedRune
    ? getCreate2RuneAddress(selectedRune.rune.id)
    : undefined;

  const handleDonate = async () => {
    if (!amount || !selectedRune || !runeERC20Address) return;

    const amountWei = parseUnits(amount, 18);
    const result = await donate(
      amountWei,
      runeERC20Address,
      selectedRune.rune.id
    );

    if (result) {
      setAmount("");
      refetch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-btc-orange/10 rounded-full blur-3xl pointer-events-none" />
      <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-btc-orange to-[#FF7A00] flex items-center gap-2 z-10 w-fit">
        <span className="text-2xl drop-shadow-md">💖</span> Fund the Pool
      </h2>
      <p className="text-btc-muted text-xs leading-relaxed">
        Donate Rune tokens to fill the SmilePool reward pool. Help reward smilers around the world.
      </p>

      {/* Rune selector */}
      <div className="flex flex-col gap-2 z-10">
        <label className="text-xs text-btc-dark uppercase tracking-widest font-black">
          Select Rune
        </label>
        <select
          value={selectedRune?.rune.id ?? ""}
          onChange={(e) => {
            const entry = runes?.results?.find((r: RuneEntry) => r.rune.id === e.target.value) ?? null;
            setSelectedRune(entry);
          }}
          className="w-full py-3 px-4 rounded-xl bg-white/40 border border-black/5 text-btc-dark text-sm font-bold focus:outline-none focus:border-btc-orange focus:ring-2 focus:ring-btc-orange/20 transition-all cursor-pointer shadow-inner"
        >
          <option value="">
            {runesLoading ? "Loading runes..." : "Choose a rune..."}
          </option>
          {runes?.results?.map((runeEntry: RuneEntry) => (
            <option key={runeEntry.rune.id} value={runeEntry.rune.id}>
              {runeEntry.rune.spaced_name || runeEntry.rune.name || runeEntry.rune.id}
              {" — Balance: "}
              {formatRuneBalance(runeEntry.balance)}
            </option>
          ))}
        </select>
        {!runesLoading && (!runes?.results || runes.results.length === 0) && (
          <p className="text-btc-amber text-xs font-semibold mt-1 bg-btc-amber/10 p-2 rounded-lg inline-block">
            No runes found. Connect Xverse with SMILE Runes.
          </p>
        )}
      </div>

      {/* Amount input */}
      <div className="flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between">
          <label className="text-xs text-btc-dark uppercase tracking-widest font-black">
            Amount
          </label>
          {selectedRune && (
            <span className="text-xs text-btc-muted font-medium">
              Balance: <span className="text-btc-dark font-bold">{formatRuneBalance(selectedRune.balance)}</span>
              <button
                type="button"
                onClick={() => setAmount((BigInt(selectedRune.balance.toString()) / WEI).toString())}
                className="ml-2 bg-btc-orange/10 text-btc-orange hover:bg-btc-orange/20 px-2 py-0.5 rounded-md font-bold transition-colors"
              >
                MAX
              </button>
            </span>
          )}
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          min="0"
          step="1"
          className="w-full py-3 px-4 rounded-xl bg-white/40 border border-black/5 text-btc-dark text-sm font-black focus:outline-none focus:border-btc-orange focus:ring-2 focus:ring-btc-orange/20 transition-all placeholder:text-btc-muted/50 shadow-inner"
        />
      </div>

      <button
        onClick={handleDonate}
        disabled={!amount || !selectedRune || !runeERC20Address || isDonatePending}
        className={`w-full py-3.5 px-6 rounded-2xl font-black text-base transition-all duration-300 transform active:scale-95 z-10 flex items-center justify-center gap-2 ${amount && selectedRune && !isDonatePending
            ? "bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white hover:brightness-110 shadow-xl shadow-btc-orange/30"
            : "bg-black/5 border border-black/5 text-btc-muted/60 cursor-not-allowed"
          }`}
      >
        {isDonatePending ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Donating...
          </span>
        ) : (
          "Fund the Pool"
        )}
      </button>

      {lastTx && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-btc-success/10 border border-btc-success/30 rounded-2xl p-4 text-center z-10"
        >
          <p className="text-btc-success text-sm font-bold mb-1.5 flex items-center justify-center gap-1">
            <span>💖</span> Donation Confirmed!
          </p>
          <a
            href={lastTx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-btc-success font-medium text-xs break-all hover:text-btc-dark transition-colors underline decoration-btc-success/30 underline-offset-2"
          >
            View on Explorer →
          </a>
        </motion.div>
      )}

      {error && (
        <p className="text-btc-danger text-xs text-center">{error}</p>
      )}
    </motion.div>
  );
}
