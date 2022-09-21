import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import React, { useEffect, useState } from "react";
import {
	crowdfund,
	donate,
	getCampaigns,
	getConnection,
	withdraw,
} from "../functions";
import Campaigns from "./Campaigns";
import { Campaign } from "./interfaces/interface";
function CenterPart() {
	const [connected, setConnected] = useState(false);
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);

	const wallet = useAnchorWallet();

	useEffect(() => {
		if (wallet) {
			setConnected(true);
		}
	}, [wallet]);

	async function handleClick() {
		await crowdfund(wallet!);
	}

	async function handleGet() {
		let campaignz = await getCampaigns(wallet!);
		setCampaigns(campaignz);
	}

	async function handleDonate(targetPDA: PublicKey) {
		await donate(wallet!, targetPDA);
		handleGet();
	}

	async function handleWithdraw(targetPDA: PublicKey) {
		await withdraw(wallet!, targetPDA);

		handleGet();
	}

	return (
		<>
			{connected && (
				<>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							marginTop: "5px",
						}}
					>
						<button
							onClick={() => handleClick()}
							style={{
								marginTop: "20px",
								height: "50px",
								width: "200px",
								marginRight: "20px",
							}}
						>
							Create a campaign
						</button>
						<button
							onClick={() => handleGet()}
							style={{
								marginTop: "20px",
								height: "50px",
								width: "200px",
							}}
						>
							Get campaigns
						</button>
					</div>
					<Campaigns
						campaigns={campaigns}
						handleDonate={handleDonate}
						handleWithdraw={handleWithdraw}
					/>
				</>
			)}
		</>
	);
}

export default CenterPart;
