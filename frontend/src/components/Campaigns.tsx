import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import React, { Key, useEffect, useState } from "react";
import { donate, getCampaigns } from "../functions";
import { Campaign } from "./interfaces/interface";

const Campaigns: React.FC<{
	campaigns: Campaign[];
	handleDonate: (targetPDA: PublicKey) => void;
	handleWithdraw: (targetPDA: PublicKey) => void;
}> = (props) => {
	const wallet = useAnchorWallet();

	async function donateHandler(targetPDA: PublicKey) {
		await props.handleDonate(targetPDA);
	}
	async function withdrawHandler(targetPDA: PublicKey) {
		await props.handleWithdraw(targetPDA);
	}

	return (
		<ul>
			{props.campaigns.map((item) => {
				return (
					<>
						<li key={Math.random()}>
							<p>Campaign name: {item.name}</p>
							<p>Campaign description: {item.description} </p>
							<p>Campaign admin: {item.admin.toString()}</p>
							<p>Amount donated: {item.amountDonated / LAMPORTS_PER_SOL}</p>
							<button
								onClick={() => {
									donateHandler(item.pubkey);
								}}
							>
								Donate
							</button>
							{wallet!.publicKey.toString() === item.admin.toString() && (
								<button
									style={{ marginLeft: "10px" }}
									onClick={() => {
										withdrawHandler(item.pubkey);
									}}
								>
									Withdraw
								</button>
							)}
						</li>
					</>
				);
			})}
		</ul>
	);
};

export default Campaigns;
