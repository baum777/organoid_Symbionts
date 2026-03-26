/**
 * On-chain verification for identity facts.
 *
 * This is intentionally read-only: it checks whether a mint or wallet exists
 * and whether the mint parses as a valid SPL token mint. No writes, no claims
 * about consciousness or autonomy.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { parseMintData } from "../adapters/onchain/parsers.js";
import { TruthStatus, type TruthState } from "./types.js";

const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const DEFAULT_COMMITMENT = "confirmed" as const;
const CONNECTION_TIMEOUT_MS = 30_000;

function resolveRpcUrl(rpcUrl?: string): string {
  return rpcUrl?.trim() || process.env.SOLANA_RPC_PRIMARY_URL?.trim() || DEFAULT_SOLANA_RPC_URL;
}

function createConnection(rpcUrl?: string): Connection {
  return new Connection(resolveRpcUrl(rpcUrl), {
    commitment: DEFAULT_COMMITMENT,
    confirmTransactionInitialTimeout: CONNECTION_TIMEOUT_MS,
  });
}

function classifyRpcFailure(error: unknown, rpcUrl: string): TruthState {
  const reason = error instanceof Error ? error.message : String(error);
  const normalized = reason.toLowerCase();

  if (
    normalized.includes("timeout") ||
    normalized.includes("etimedout") ||
    normalized.includes("econnrefused") ||
    normalized.includes("connection refused") ||
    normalized.includes("network") ||
    normalized.includes("503") ||
    normalized.includes("429")
  ) {
    return {
      status: TruthStatus.RPC_DOWN,
      reason,
      rpcUrl,
    };
  }

  if (
    normalized.includes("invalid public key") ||
    normalized.includes("invalid base58") ||
    normalized.includes("invalid mint data") ||
    normalized.includes("expected 82 bytes") ||
    normalized.includes("failed to parse")
  ) {
    return {
      status: TruthStatus.MISMATCH,
      reason,
      rpcUrl,
    };
  }

  return {
    status: TruthStatus.UNVERIFIED,
    reason,
    rpcUrl,
  };
}

function invalidAddressState(kind: "mint" | "wallet", value: string, rpcUrl: string): TruthState {
  return {
    status: TruthStatus.MISMATCH,
    reason: `Invalid ${kind} address: ${value}`,
    rpcUrl,
  };
}

/**
 * Verifies that a mint account exists and parses as a valid SPL token mint.
 * Returns UNVERIFIED when the account is missing, RPC_DOWN when the chain is
 * unavailable, and MISMATCH when the account is not a valid mint structure.
 */
export async function verifyMintOnChain(mint: string, rpcUrl?: string): Promise<TruthState> {
  const endpoint = resolveRpcUrl(rpcUrl);
  let mintPubkey: PublicKey;

  try {
    mintPubkey = new PublicKey(mint);
  } catch {
    return invalidAddressState("mint", mint, endpoint);
  }

  const connection = createConnection(endpoint);

  try {
    const accountInfo = await connection.getAccountInfo(mintPubkey, DEFAULT_COMMITMENT);
    if (!accountInfo) {
      return {
        status: TruthStatus.UNVERIFIED,
        reason: "Mint account not found on-chain",
        rpcUrl: endpoint,
      };
    }

    const data = Buffer.from(accountInfo.data);
    if (data.length !== 82) {
      return {
        status: TruthStatus.MISMATCH,
        reason: `Mint account is not an SPL mint (size ${data.length})`,
        rpcUrl: endpoint,
      };
    }

    parseMintData(mintPubkey, data);

    return {
      status: TruthStatus.OK,
      verifiedAt: new Date().toISOString(),
      reason: "Mint account verified",
      rpcUrl: endpoint,
    };
  } catch (error) {
    return classifyRpcFailure(error, endpoint);
  }
}

/**
 * Verifies that a wallet account exists on-chain.
 * This is a minimal read-only existence check, not an ownership or balance claim.
 */
export async function verifyWalletOnChain(wallet: string, rpcUrl?: string): Promise<TruthState> {
  const endpoint = resolveRpcUrl(rpcUrl);
  let walletPubkey: PublicKey;

  try {
    walletPubkey = new PublicKey(wallet);
  } catch {
    return invalidAddressState("wallet", wallet, endpoint);
  }

  const connection = createConnection(endpoint);

  try {
    const accountInfo = await connection.getAccountInfo(walletPubkey, DEFAULT_COMMITMENT);
    if (!accountInfo) {
      return {
        status: TruthStatus.UNVERIFIED,
        reason: "Wallet account not found on-chain",
        rpcUrl: endpoint,
      };
    }

    return {
      status: TruthStatus.OK,
      verifiedAt: new Date().toISOString(),
      reason: "Wallet account exists on-chain",
      rpcUrl: endpoint,
    };
  } catch (error) {
    return classifyRpcFailure(error, endpoint);
  }
}
