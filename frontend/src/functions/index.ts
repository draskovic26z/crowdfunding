import { Provider, Program, web3 } from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
	Commitment,
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	RpcResponseAndContext,
	SignatureStatus,
	SimulatedTransactionResponse,
	Transaction,
	TransactionInstruction,
	TransactionSignature,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { ACTIVE_NETWORK } from "../components/constants/common";
import { IDL as programIDL } from "../type/programIDL";

interface Campaign {
	pubkey: PublicKey;
	admin: PublicKey;
	amountDonated: number;
	description: string;
	name: string;
}

const PROGRAM_ID = new PublicKey(
	"C8eV1vTKvvgwyk7TKGDrXouRCs9bfLx1c6EKGrkj1pck"
);

const { SystemProgram } = web3;

export function getConnection(): Connection {
	return new Connection(ACTIVE_NETWORK.URL, "processed");
}

export async function getProgram(wallet: AnchorWallet) {
	const provider = new Provider(getConnection(), wallet, {
		commitment: "finalized",
	});
	return new Program(programIDL, PROGRAM_ID, provider);
}

export async function crowdfund(wallet: AnchorWallet) {
	const program = await getProgram(wallet);
	try {
		const [campaign] = await PublicKey.findProgramAddress(
			[Buffer.from("CAMPAIGN_DEMO"), wallet.publicKey.toBuffer()],
			PROGRAM_ID
		);

		try {
			console.log(await program.account.campaign.fetch(campaign));
			return;
		} catch (error) {
			console.log("doesnt exist yet");
		}

		const createIx: TransactionInstruction = program.instruction.create(
			"Campaign name",
			"campaign description",
			{
				accounts: {
					campaign,
					user: wallet.publicKey,
					systemProgram: SystemProgram.programId,
				},
			}
		);

		const recentBlockhash = (await getConnection().getRecentBlockhash())
			.blockhash;

		const txBuy = new Transaction({
			feePayer: wallet.publicKey,
			recentBlockhash: recentBlockhash,
		});

		txBuy.add(createIx);
		console.log(txBuy);

		const signedBuy = await wallet.signTransaction(txBuy);
		console.log(signedBuy);

		await sendTransaction({
			connection: getConnection(),
			transaction: signedBuy,
			wallet,
		});

		console.log("Created a new campaign with address: ", campaign.toString());
	} catch (error) {}
}

export async function getCampaigns(wallet: AnchorWallet) {
	const program = await getProgram(wallet);

	let campaigns: Campaign[] = await (
		await program.account.campaign.all()
	).map((item) => {
		return {
			pubkey: item.publicKey,
			admin: item.account.admin,
			amountDonated: item.account.amountDonated.toNumber(),
			description: item.account.description as string,
			name: item.account.name as string,
		};
	});
	console.log(campaigns);

	return campaigns;
}

export async function donate(wallet: AnchorWallet, publicKey: PublicKey) {
	try {
		const program = await getProgram(wallet);

		const donateIx = await program.instruction.donate(
			new BN(0.1 * web3.LAMPORTS_PER_SOL),
			{
				accounts: {
					campaign: publicKey,
					user: wallet.publicKey,
					systemProgram: SystemProgram.programId,
				},
			}
		);

		const recentBlockhash = (await getConnection().getRecentBlockhash())
			.blockhash;

		const txDonate = new Transaction({
			feePayer: wallet.publicKey,
			recentBlockhash: recentBlockhash,
		});

		txDonate.add(donateIx);

		const signedDonate = await wallet.signTransaction(txDonate);
		console.log(signedDonate);

		await sendTransaction({
			connection: getConnection(),
			transaction: signedDonate,
			wallet,
		});

		console.log("successful donation");
	} catch (error) {
		console.log(error);
	}
}

export async function withdraw(wallet: AnchorWallet, targetPDA: PublicKey) {
	try {
		const program = await getProgram(wallet);

		const withdrawIx = program.instruction.withdraw(
			new BN(0.1 * LAMPORTS_PER_SOL),
			{
				accounts: {
					campaign: targetPDA,
					user: wallet.publicKey,
				},
			}
		);

		const recentBlockhash = (await getConnection().getRecentBlockhash())
			.blockhash;

		const withdrawTx = new Transaction({
			feePayer: wallet.publicKey,
			recentBlockhash: recentBlockhash,
		});

		withdrawTx.add(withdrawIx);

		const signedTx = await wallet.signTransaction(withdrawTx);
		await sendTransaction({
			connection: getConnection(),
			transaction: signedTx,
			wallet,
		});

		console.log("successful withdrawal");
	} catch (error) {
		console.log(error);
	}
}

export async function sendTransaction({
	transaction,
	wallet,
	signers = [],
	connection,
	sendingMessage = "Sending transaction...",
	errorMessage = "Transaction failed",
	timeout = 30000,
}: {
	transaction: Transaction;
	wallet: AnchorWallet;
	signers?: Array<Keypair>;
	connection: Connection;
	sendingMessage?: string;
	errorMessage?: string;
	timeout?: number;
}) {
	if (!wallet.publicKey) throw new Error("Wallet not connected!");
	const accountInfo = await getConnection().getParsedAccountInfo(
		wallet.publicKey
	);
	if (!accountInfo.value) throw new Error("You do not have enough SOL.");

	return await sendSignedTransaction({
		signedTransaction: transaction,
		connection,
		sendingMessage,
		errorMessage,
		timeout,
	});
}

export async function sendSignedTransaction({
	signedTransaction,
	connection,
	timeout = 30000,
	errorMessage,
}: {
	signedTransaction: Transaction;
	connection: Connection;
	sendingMessage?: string;
	sentMessage?: string;
	successMessage?: string;
	errorMessage?: string;
	timeout?: number;
}): Promise<{ txid: string; slot: number }> {
	const rawTransaction = signedTransaction.serialize();
	const startTime = getUnixTs();
	let slot = 0;
	const txid: TransactionSignature = await connection.sendRawTransaction(
		rawTransaction,
		{
			skipPreflight: true,
		}
	);

	console.log("Started awaiting confirmation for", txid);

	let done = false;
	(async () => {
		while (!done && getUnixTs() - startTime < timeout) {
			connection.sendRawTransaction(rawTransaction, {
				skipPreflight: true,
			});
			await sleep(500);
		}
	})();

	try {
		const confirmation = await awaitTransactionSignatureConfirmation(
			txid,
			timeout,
			connection,
			"recent",
			true
		);

		if (confirmation.err) {
			console.error(confirmation.err);
			throw new Error("Transaction failed: Custom instruction error");
		}

		slot = confirmation?.slot || 0;
	} catch (error) {
		if (error instanceof Object && error.hasOwnProperty("timeout")) {
			throw new Error("Timed out awaiting confirmation on transaction");
		}
		let simulateResult: SimulatedTransactionResponse | null = null;
		try {
			simulateResult = (
				await simulateTransaction(connection, signedTransaction, "single")
			).value;
		} catch (e) {
			//
		}
		// mapSolanaErrors(simulateResult, errorMessage ?? 'Transaction failed', txid);

		// throw new TransactionError('Transaction failed', txid);
		throw new Error("Transaction failed");
	} finally {
		done = true;
	}

	console.log("Latency", txid, getUnixTs() - startTime);
	return { txid, slot };
}

export async function simulateTransaction(
	connection: Connection,
	transaction: Transaction,
	commitment: Commitment
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
	// @ts-ignore
	transaction.recentBlockhash = await connection._recentBlockhash(
		// @ts-ignore
		connection._disableBlockhashCaching
	);

	console.log("simulating transaction", transaction);

	const signData = transaction.serializeMessage();
	// @ts-ignore
	const wireTransaction = transaction._serialize(signData);
	const encodedTransaction = wireTransaction.toString("base64");

	console.log("encoding");
	const config: any = { encoding: "base64", commitment };
	const args = [encodedTransaction, config];
	console.log("simulating data", args);

	// @ts-ignore
	const res = await connection._rpcRequest("simulateTransaction", args);

	console.log("res simulating transaction", res);
	if (res.error) {
		throw new Error("failed to simulate transaction: " + res.error.message);
	}
	return res.result;
}

async function awaitTransactionSignatureConfirmation(
	txid: TransactionSignature,
	timeout: number,
	connection: Connection,
	commitment: Commitment = "recent",
	queryStatus = false
) {
	let done = false;
	let status: SignatureStatus | null = {
		slot: 0,
		confirmations: 0,
		err: null,
	};
	let subId = 0;
	console.log("hehe");

	await new Promise((resolve, reject) => {
		const fn = async () => {
			setTimeout(() => {
				if (done) {
					return;
				}
				done = true;
				reject({ timeout: true });
			}, timeout);
			try {
				subId = connection.onSignature(
					txid,
					(result, context) => {
						done = true;
						status = {
							err: result.err,
							slot: context.slot,
							confirmations: 0,
						};
						if (result.err) {
							console.log("Rejected via websocket", result.err);
							reject(result.err);
						} else {
							console.log("Resolved via websocket", result);
							resolve(result);
						}
					},
					commitment
				);
			} catch (e) {
				done = true;
				console.error("WS error in setup", txid, e);
			}
			while (!done && queryStatus) {
				// eslint-disable-next-line no-loop-func
				const fn = async () => {
					try {
						const signatureStatuses = await connection.getSignatureStatuses([
							txid,
						]);
						status = signatureStatuses && signatureStatuses.value[0];
						if (!done) {
							if (!status) {
								console.log("REST null result for", txid, status);
							} else if (status.err) {
								console.log("REST error for", txid, status);
								done = true;
								reject(status.err);
							} else if (!status.confirmations) {
								console.log("REST no confirmations for", txid, status);
							} else {
								console.log("REST confirmation for", txid, status);
								done = true;
								resolve(status);
							}
						}
					} catch (e) {
						if (!done) {
							console.log("REST connection error: txid", txid, e);
						}
						throw e;
					}
				};
				await fn();
				await sleep(2000);
			}
		};
		fn();
	})
		.catch((err) => {
			if (err.timeout && status) {
				status.err = { timeout: true };
			}

			//@ts-ignore
			if (connection._signatureSubscriptions[subId])
				connection.removeSignatureListener(subId);
			throw err;
		})
		.then((_) => {
			//@ts-ignore
			if (connection._signatureSubscriptions[subId])
				connection.removeSignatureListener(subId);
		});
	done = true;
	return status;
}

export const sleep = (ttl: number) =>
	new Promise((resolve) => setTimeout(() => resolve(true), ttl));

export function getUnixTs() {
	return new Date().getTime() / 1000;
}
