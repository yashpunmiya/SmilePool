import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { MidlProvider } from "@midl/react";
import { SatoshiKitProvider } from "@midl/satoshi-kit";
import { WagmiMidlProvider } from "@midl/executor-react";

import { midlConfig, queryClient } from "./config";
import App from "./App";

import "@midl/satoshi-kit/styles.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MidlProvider config={midlConfig}>
        <SatoshiKitProvider>
          <WagmiMidlProvider>
            <App />
          </WagmiMidlProvider>
        </SatoshiKitProvider>
      </MidlProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
