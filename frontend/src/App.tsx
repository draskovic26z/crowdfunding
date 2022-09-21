import React from "react";
import CenterPart from "./components/CenterPart";
import Navbar from "./components/Navbar/Navbar";
import { WalletWrapper } from "./components/WalletWrapper/WalletWrapper";

const App: React.FC = () => {
	return (
		<WalletWrapper>
			<div
				style={{ backgroundColor: "#C4D6B0", width: "100vw", height: "150vh" }}
			>
				<Navbar />
				<CenterPart />
			</div>
		</WalletWrapper>
	);
};

export default App;
