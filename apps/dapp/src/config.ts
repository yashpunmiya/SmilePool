import { type Config, MaestroSymphonyProvider, regtest } from "@midl/core";
import { createMidlConfig } from "@midl/satoshi-kit";
import { QueryClient } from "@tanstack/react-query";

export const midlConfig = createMidlConfig({
  networks: [regtest],
  persist: true,
  runesProvider: new MaestroSymphonyProvider({
    regtest: "https://runes.staging.midl.xyz",
  }),
}) as Config;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 10_000, // Poll every 10s to keep balances fresh
      staleTime: 5_000,
    },
  },
});

// Contract config
export const SMILEPOOL_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0xFAACE8aD6dFE99023142d16eCe92408D9a2C7E30") as `0x${string}`;

export const MIDL_RPC = "https://rpc.staging.midl.xyz";
export const CHAIN_ID = 15001;
export const EXPLORER_URL = "https://blockscout.staging.midl.xyz";
export const MEMPOOL_URL = "https://mempool.staging.midl.xyz";
