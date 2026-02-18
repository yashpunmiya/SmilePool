import { usePoolBalance } from "../hooks/usePoolBalance";
import { motion } from "framer-motion";

export function PoolStats() {
  const { data, isLoading, error } = usePoolBalance();

  if (error) {
    return (
      <div className="rounded-2xl bg-btc-card border border-btc-border p-6">
        <p className="text-btc-danger text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Pool Balance"
        value={isLoading ? "..." : `${Number(data?.poolBalanceFormatted || 0).toFixed(2)}`}
        suffix="SMILES"
        color="text-btc-orange"
        icon="🏦"
        primary
      />
      <StatCard
        label="Reward / Smile"
        value={isLoading ? "..." : `${Number(data?.rewardAmountFormatted || 0).toFixed(2)}`}
        suffix="SMILES"
        color="text-btc-success"
        icon="🎁"
      />
      <StatCard
        label="Total Smiles"
        value={isLoading ? "..." : `${data?.totalSmiles?.toString() || "0"}`}
        suffix=""
        color="text-purple-400"
        icon="😊"
      />
      <StatCard
        label="Min Score"
        value={isLoading ? "..." : `${data?.scoreThreshold?.toString() || "75"}`}
        suffix="/ 100"
        color="text-yellow-400"
        icon="🎯"
      />
      <StatCard
        label="Unique Smilers"
        value={isLoading ? "..." : `${data?.totalSmilers?.toString() || "0"}`}
        suffix=""
        color="text-cyan-400"
        icon="👥"
      />
      <StatCard
        label="Donations"
        value={isLoading ? "..." : `${data?.totalDonations?.toString() || "0"}`}
        suffix=""
        color="text-pink-400"
        icon="💝"
      />
      <StatCard
        label="Total Donated"
        value={isLoading ? "..." : `${Number(data?.totalDonatedFormatted || 0).toFixed(2)}`}
        suffix="SMILES"
        color="text-emerald-400"
        icon="📥"
      />
      <StatCard
        label="Total Claimed"
        value={isLoading ? "..." : `${Number(data?.totalClaimedFormatted || 0).toFixed(2)}`}
        suffix="SMILES"
        color="text-rose-400"
        icon="📤"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color,
  icon,
  primary,
}: {
  label: string;
  value: string;
  suffix: string;
  color: string;
  icon: string;
  primary?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-btc-card/80 border p-3 flex flex-col gap-0.5 ${
        primary ? "border-btc-orange/20 glow-orange" : "border-btc-border/40"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-btc-muted text-[10px] uppercase tracking-widest font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${color}`}>{value}</span>
        {suffix && <span className="text-btc-muted text-[10px]">{suffix}</span>}
      </div>
    </motion.div>
  );
}
