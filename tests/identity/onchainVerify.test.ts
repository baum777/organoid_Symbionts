import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Connection } from "@solana/web3.js";
import { TruthStatus } from "../../src/identity/types.js";
import { verifyMintOnChain, verifyWalletOnChain } from "../../src/identity/onchainVerify.js";

vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: vi.fn(),
  };
});

function createMintData(): Buffer {
  const data = Buffer.alloc(82);
  data.writeBigUInt64LE(123n, 36);
  data[44] = 6;
  data[45] = 1;
  return data;
}

describe("onchainVerify", () => {
  const connectionMock = Connection as unknown as {
    mockImplementation: (impl: () => { getAccountInfo: ReturnType<typeof vi.fn> }) => void;
    mockClear: () => void;
  };

  beforeEach(() => {
    process.env.SOLANA_RPC_PRIMARY_URL = "https://rpc.test";
    connectionMock.mockClear();
  });

  afterEach(() => {
    delete process.env.SOLANA_RPC_PRIMARY_URL;
    vi.restoreAllMocks();
  });

  it("returns OK for a valid SPL mint account", async () => {
    const getAccountInfo = vi.fn().mockResolvedValue({ data: createMintData() });
    connectionMock.mockImplementation(() => ({ getAccountInfo }));

    const result = await verifyMintOnChain("So11111111111111111111111111111111111111112", "https://rpc.test");

    expect(result.status).toBe(TruthStatus.OK);
    expect(result.reason).toContain("verified");
    expect(result.verifiedAt).toBeDefined();
    expect(getAccountInfo).toHaveBeenCalledTimes(1);
  });

  it("returns UNVERIFIED when the mint account is missing", async () => {
    const getAccountInfo = vi.fn().mockResolvedValue(null);
    connectionMock.mockImplementation(() => ({ getAccountInfo }));

    const result = await verifyMintOnChain("So11111111111111111111111111111111111111112", "https://rpc.test");

    expect(result.status).toBe(TruthStatus.UNVERIFIED);
    expect(result.reason).toContain("not found");
  });

  it("returns MISMATCH for invalid mint addresses", async () => {
    const result = await verifyMintOnChain("not-a-base58-address", "https://rpc.test");
    expect(result.status).toBe(TruthStatus.MISMATCH);
  });

  it("returns RPC_DOWN when the RPC rejects the request", async () => {
    const getAccountInfo = vi.fn().mockRejectedValue(new Error("connect ETIMEDOUT"));
    connectionMock.mockImplementation(() => ({ getAccountInfo }));

    const result = await verifyMintOnChain("So11111111111111111111111111111111111111112", "https://rpc.test");

    expect(result.status).toBe(TruthStatus.RPC_DOWN);
    expect(result.reason).toContain("ETIMEDOUT");
  });

  it("verifies wallet existence with a minimal read-only check", async () => {
    const getAccountInfo = vi.fn().mockResolvedValue({ data: Buffer.alloc(0) });
    connectionMock.mockImplementation(() => ({ getAccountInfo }));

    const result = await verifyWalletOnChain("11111111111111111111111111111111", "https://rpc.test");

    expect(result.status).toBe(TruthStatus.OK);
    expect(result.reason).toContain("exists");
  });
});

