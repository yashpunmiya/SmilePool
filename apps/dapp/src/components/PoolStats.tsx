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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Pool Balance"
        value={isLoading ? "..." : `${Number(data?.poolBalanceFormatted || 0).toFixed(2)}`}
        suffix="tokens"
        color="text-btc-orange"
      />
      <StatCard
        label="Reward Per Smile"
        value={isLoading ? "..." : `${Number(data?.rewardAmountFormatted || 0).toFixed(2)}`}
        suffix="tokens"
        color="text-btc-success"
      />
      <StatCard
        label="Total Smiles"
        value={isLoading ? "..." : `${data?.totalSmiles?.toString() || "0"}`}
        suffix=""
        color="text-purple-400"
      />
      <StatCard
        label="Score Threshold"
        value={isLoading ? "..." : `${data?.scoreThreshold?.toString() || "75"}`}
        suffix="/ 100"
        color="text-yellow-400"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string;
  suffix: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-btc-card border border-btc-border p-5 flex flex-col gap-1"
    >
      <span className="text-btc-muted text-xs uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {suffix && <span className="text-btc-muted text-sm">{suffix}</span>}
      </div>
    </motion.div>
  );
}
