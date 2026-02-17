import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "@midl/hardhat-deploy";
import { midlRegtest } from "@midl/executor";
import { type HardhatUserConfig, vars } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "regtest",
  midl: {
    networks: {
      regtest: {
        mnemonic: vars.get("MNEMONIC"),
        path: "deployments",
        confirmationsRequired: 1,
        btcConfirmationsRequired: 1,
        hardhatNetwork: "regtest",
        network: {
          explorerUrl: "https://mempool.staging.midl.xyz",
          id: "regtest",
          network: "regtest",
        },
      },
    },
  },
  networks: {
    regtest: {
      url: midlRegtest.rpcUrls.default.http[0],
      chainId: midlRegtest.id,
    },
  },
  etherscan: {
    apiKey: {
      regtest: "empty",
    },
    customChains: [
      {
        network: "regtest",
        chainId: midlRegtest.id,
        urls: {
          apiURL: "https://blockscout.staging.midl.xyz/api",
          browserURL: "https://blockscout.staging.midl.xyz",
        },
      },
    ],
  },
};

export default config;
