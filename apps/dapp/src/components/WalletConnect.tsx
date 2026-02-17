import { ConnectButton } from "@midl/satoshi-kit";

export function WalletConnect() {
  return (
    <div className="flex items-center gap-3">
      <ConnectButton />
    </div>
  );
}
