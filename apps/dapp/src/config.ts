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

// Contract config — update after deployment
export const SMILEPOOL_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const MIDL_RPC = "https://evm-rpc.regtest.midl.xyz";
export const CHAIN_ID = 777;
export const EXPLORER_URL = "https://blockscout.staging.midl.xyz";
export const MEMPOOL_URL = "https://mempool.staging.midl.xyz";
