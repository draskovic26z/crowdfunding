import {
	WalletModalProvider,
	WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import React from "react";
import classes from "./Navbar.module.css";
const Navbar: React.FC = () => {
	return (
		<WalletModalProvider>
			<div className={classes.navbarContainer__walletContainer}>
				<WalletMultiButton style={{ marginTop: "20px" }} />
			</div>
		</WalletModalProvider>
	);
};

export default Navbar;
