import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import {
	getPhantomWallet,
	getSlopeWallet,
	getSolflareWallet,
	getSolflareWebWallet,
	getSolletExtensionWallet,
	getSolletWallet,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import React, { useMemo } from "react";
import { ACTIVE_NETWORK } from "../constants/common";

require("@solana/wallet-adapter-react-ui/styles.css");

export const WalletWrapper: React.FC<{ children: React.ReactNode }> = (
	props
) => {
	const network = ACTIVE_NETWORK.NAME;
	const endpoint = useMemo(() => clusterApiUrl(network), [network]);

	const wallets = useMemo(
		() => [
			getPhantomWallet(),
			getSolflareWebWallet({ network }),
			getSolflareWallet(),
			getSolletWallet({ network }),
			getSolletExtensionWallet({ network }),
			getSlopeWallet(),
		],
		[network]
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider
				wallets={wallets}
				autoConnect
				onError={(e) => console.log(e)}
			>
				{props.children}
			</WalletProvider>
		</ConnectionProvider>
	);
};
