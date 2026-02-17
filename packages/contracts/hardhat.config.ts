import "@midl/hardhat-deploy";
import { MaestroSymphonyProvider, MempoolSpaceProvider } from "@midl/core";
import "@nomicfoundation/hardhat-verify";
import { midlRegtest } from "@midl/executor";
import { config as dotenvConfig } from "dotenv";
import "hardhat-deploy";
import type { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";
import "tsconfig-paths/register";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const mnemonic =
  process.env.MNEMONIC ||
  "test test test test test test test test test test test junk";

const config: HardhatUserConfig = {
  networks: {
    regtest: {
      url: "https://rpc.staging.midl.xyz",
      accounts: {
        mnemonic,
        path: "m/86'/1'/0'/0/0",
      },
      chainId: 15001,
    },
  },
  midl: {
    path: "deployments",
    networks: {
      regtest: {
        mnemonic,
        confirmationsRequired: 1,
        btcConfirmationsRequired: 1,
        hardhatNetwork: "regtest",
        network: {
          explorerUrl: "https://mempool.staging.midl.xyz",
          id: "regtest",
          network: "regtest",
        },
        providerFactory: () =>
          new MempoolSpaceProvider({
            regtest: "https://mempool.staging.midl.xyz",
          }),
        runesProviderFactory: () =>
          new MaestroSymphonyProvider({
            regtest: "https://runes.staging.midl.xyz",
          }),
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      regtest: "empty",
    },
    customChains: [
      {
        network: "regtest",
        chainId: 15001,
        urls: {
          apiURL: "https://blockscout.staging.midl.xyz/api",
          browserURL: "https://blockscout.staging.midl.xyz",
        },
      },
    ],
  },
};

export default config;
