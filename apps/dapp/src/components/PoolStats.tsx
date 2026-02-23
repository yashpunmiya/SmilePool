import { usePoolBalance } from "../hooks/usePoolBalance";
import { motion } from "framer-motion";
import { Database, Gift, Smile, Target, Users, Heart, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export function PoolStats() {
  const { data, isLoading, error } = usePoolBalance();

  if (error) {
    return (
      <div className="rounded-3xl glass-panel p-6">
        <p className="text-btc-danger text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Pool Balance"
        value={isLoading ? "..." : `${Number(data?.poolBalanceFormatted || 0).toFixed(2)}`}
        suffix="SMILE"
        color="text-btc-orange"
        icon={<Database size={15} className="text-btc-orange drop-shadow-sm opacity-90" strokeWidth={2.5} />}
        primary
      />
      <StatCard
        label="Reward / Smile"
        value={isLoading ? "..." : `${Number(data?.rewardAmountFormatted || 0).toFixed(2)}`}
        suffix="SMILE"
        color="text-btc-success"
        icon={<Gift size={15} className="text-btc-success drop-shadow-sm opacity-90" strokeWidth={2.5} />}
      />
      <StatCard
        label="Total Smiles"
        value={isLoading ? "..." : `${data?.totalSmiles?.toString() || "0"}`}
        suffix=""
        color="text-purple-600"
        icon={<Smile size={15} className="text-purple-600 drop-shadow-sm opacity-90" strokeWidth={2.5} />}
      />
      <StatCard
        label="Min Score"
        value={isLoading ? "..." : `${data?.scoreThreshold?.toString() || "75"}`}
        suffix="/ 100"
        color="text-yellow-600"
        icon={<Target size={15} className="text-yellow-600 drop-shadow-sm opacity-90" strokeWidth={2.5} />}
      />
      <StatCard
        label="Unique Smilers"
        value={isLoading ? "..." : `${data?.totalSmilers?.toString() || "0"}`}
        suffix=""
        color="text-cyan-600"
        icon={<Users size={15} className="text-cyan-600 drop-shadow-sm opacity-90" strokeWidth={2.5} />}
      />
      <StatCard
        label="Donations"
        value={isLoading ? "..." : `${data?.totalDonations?.toString() || "0"}`}
        suffix=""
        color="text-pink-600"
        icon={<Heart size={15} className="text-pink-600 drop-shadow-sm opacity-90" strokeWidth={2.5} />}
      />
      <StatCard
        label="Total Donated"
        value={isLoading ? "..." : `${Number(data?.totalDonatedFormatted || 0).toFixed(2)}`}
        suffix="SMILE"
        color="text-emerald-600"
        icon={<ArrowDownToLine size={15} className="text-emerald-600 drop-shadow-sm opacity-90" strokeWidth={2.5} />}
      />
      <StatCard
        label="Total Claimed"
        value={isLoading ? "..." : `${Number(data?.totalClaimedFormatted || 0).toFixed(2)}`}
        suffix="SMILE"
        color="text-rose-600"
        icon={<ArrowUpFromLine size={15} className="text-rose-600 drop-shadow-sm opacity-90" strokeWidth={2.5} />}
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
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`relative overflow-hidden rounded-[20px] px-4 py-3 flex flex-col justify-center gap-1.5 ${primary ? "glass-panel border-btc-orange/40 glow-orange" : "glass-panel border-black/5"
        }`}
    >
      {primary && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-btc-orange/20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
      )}
      <div className="flex items-center gap-1.5 z-10">
        <div className={`flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-btc-dark/70 text-[9px] uppercase tracking-[0.2em] font-black mt-0.5">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1 mt-0.5 z-10">
        <span className={`text-[22px] leading-none font-black ${color} tracking-tight drop-shadow-sm`}>{value}</span>
        {suffix && <span className="text-btc-muted text-[9px] font-black tracking-widest">{suffix}</span>}
      </div>
    </motion.div>
  );
}
