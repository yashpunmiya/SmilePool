import { useEffect, useState, useCallback } from "react";
import { createPublicClient, http } from "viem";
import { smilePoolAbi, smilePoolAddress } from "../lib/contracts";
import { MIDL_RPC, CHAIN_ID } from "../config";

const chain = {
  id: CHAIN_ID,
  name: "MIDL Regtest",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: [MIDL_RPC] } },
} as const;

const publicClient = createPublicClient({
  chain,
  transport: http(MIDL_RPC),
});

export interface PoolData {
  poolBalance: bigint;
  rewardAmount: bigint;
  scoreThreshold: bigint;
  totalDonated: bigint;
  totalClaimed: bigint;
  totalSmiles: bigint;
  totalSmilers: bigint;
  totalDonations: bigint;
  poolBalanceFormatted: string;
  rewardAmountFormatted: string;
  totalDonatedFormatted: string;
  totalClaimedFormatted: string;
}

export function usePoolBalance() {
  const [data, setData] = useState<PoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (smilePoolAddress === "0x0000000000000000000000000000000000000000") {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      const stats = await publicClient.readContract({
        address: smilePoolAddress,
        abi: smilePoolAbi,
        functionName: "getPoolStats",
      });

      const [poolBalance, rewardAmount, scoreThreshold, totalDonated, totalClaimed, totalSmiles, totalSmilers, totalDonations] =
        stats as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

      setData({
        poolBalance,
        rewardAmount,
        scoreThreshold,
        totalDonated,
        totalClaimed,
        totalSmiles,
        totalSmilers,
        totalDonations,
        poolBalanceFormatted: poolBalance.toString(),
        rewardAmountFormatted: rewardAmount.toString(),
        totalDonatedFormatted: totalDonated.toString(),
        totalClaimedFormatted: totalClaimed.toString(),
      });
      setError(null);
    } catch (err) {
      console.error("Failed to fetch pool data:", err);
      setError("Failed to load pool data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
