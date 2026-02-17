/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_MIDL_RPC: string;
  readonly VITE_CHAIN_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
