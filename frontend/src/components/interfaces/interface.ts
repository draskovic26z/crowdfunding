import { PublicKey } from "@solana/web3.js";

export interface Campaign {
	pubkey: PublicKey;
	admin: PublicKey;
	amountDonated: number;
	description: string;
	name: string;
}
