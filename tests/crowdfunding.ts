import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("crowdfunding", () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.AnchorProvider.env());

	const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;
	const connection = anchor.getProvider().connection;

	it("can create", async () => {
		const user = anchor.web3.Keypair.generate();
		const tx1 = await connection.requestAirdrop(
			user.publicKey,
			LAMPORTS_PER_SOL
		);
		await connection.confirmTransaction(tx1);

		const [campaign] = await PublicKey.findProgramAddress(
			[Buffer.from("CAMPAIGN_DEMO"), user.publicKey.toBuffer()],
			program.programId
		);

		const createTx = await program.rpc.create("ana", "danilo", {
			accounts: {
				campaign,
				user: user.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [user],
		});
		await connection.confirmTransaction(createTx);
		console.log(await program.account.campaign.fetch(campaign));
	});
});
