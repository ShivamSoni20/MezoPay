import {
  Client,
  IdentifierKind,
  createBackend,
  getInboxIdForIdentifier,
  isText,
  type ClientOptions,
  type DecodedMessage,
  type Identifier,
  type Signer,
  type XmtpEnv,
} from "@xmtp/browser-sdk";
import type { WalletClient } from "viem";
import { hexToBytes, isHex } from "viem";
import {
  loadRequests,
  parseMezoPayMessage,
  requestMessageToRecord,
  updateRequestStatus,
  upsertRequest,
  type MezoPayMessage,
} from "./requests";

export async function createXmtpBackend() {
  return createBackend({ env: getXmtpEnv() });
}

export function getXmtpEnv(): XmtpEnv {
  const env = process.env.NEXT_PUBLIC_XMTP_ENV;
  if (
    env === "local" ||
    env === "dev" ||
    env === "production" ||
    env === "testnet-staging" ||
    env === "testnet-dev" ||
    env === "testnet" ||
    env === "mainnet"
  ) {
    return env;
  }
  return "dev";
}

function isInstallationLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("10/10 installations") ||
    msg.includes("revoke existing installations")
  );
}

async function revokeStaleInstallations(
  signer: Signer,
  identifier: Identifier,
): Promise<void> {
  const backend = await createBackend({ env: getXmtpEnv() });
  const inboxId = await getInboxIdForIdentifier(backend, identifier);
  console.log("revokeStaleInstallations: inboxId", inboxId);
  if (!inboxId) return;

  const states = await Client.fetchInboxStates([inboxId], backend);
  const installations = states[0]?.installations ?? [];
  console.log("revokeStaleInstallations: found installations", installations.length, installations);
  if (installations.length === 0) return;

  const installationIds = installations.map((inst) => {
    let id = inst.id as any;
    // in wasm-bindings, inst.bytes is the raw Uint8Array for the installation id.
    if (inst.bytes instanceof Uint8Array) {
      id = inst.bytes;
    } else if (typeof id === "string" && isHex(id)) {
      id = hexToBytes(id);
    } else if (typeof id === "string") {
      // XMTP sometimes uses hex without 0x prefix for installation ids
      try {
        if (/^[0-9a-fA-F]+$/.test(id)) {
           id = hexToBytes(("0x" + id) as `0x${string}`);
        } else {
           id = new TextEncoder().encode(id);
        }
      } catch {
        id = new TextEncoder().encode(id);
      }
    }
    return id;
  });
  console.log("revokeStaleInstallations: revoking ids", installationIds);

  try {
    await Client.revokeInstallations(signer, inboxId, installationIds, backend);
    console.log("revokeStaleInstallations: success");
  } catch (err) {
    console.error("revokeStaleInstallations: error revoking", err);
    throw err;
  }
}

/** Resumes an existing XMTP inbox from this browser (no MetaMask prompt). */
export async function resumeXmtpClient(
  signer: Signer,
): Promise<Client<unknown> | null> {
  const options = { env: getXmtpEnv() } as ClientOptions;
  const identifier = await Promise.resolve(signer.getIdentifier());

  try {
    const client = await Client.build(identifier, options);
    if (await client.isRegistered()) {
      return client;
    }
  } catch {
    // No local inbox for this wallet in this browser yet.
  }
  return null;
}

/** Registers XMTP inbox (MetaMask signature required on first enable). */
export async function registerXmtpClient(
  signer: Signer,
): Promise<Client<unknown>> {
  const options = { env: getXmtpEnv() } as ClientOptions;
  const identifier = await Promise.resolve(signer.getIdentifier());

  try {
    return await Client.create(signer, options);
  } catch (err) {
    if (!isInstallationLimitError(err)) throw err;
    await revokeStaleInstallations(signer, identifier);
    return await Client.create(signer, options);
  }
}

/** @deprecated Use resumeXmtpClient or registerXmtpClient */
export async function createXmtpClient(
  signer: Signer,
): Promise<Client<unknown>> {
  const resumed = await resumeXmtpClient(signer);
  if (resumed) return resumed;
  return registerXmtpClient(signer);
}

export function buildSignerFromWalletClient(walletClient: WalletClient): Signer {
  const account = walletClient.account;
  if (!account) {
    throw new Error("Wallet client has no connected account");
  }

  const address = account.address;

  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await walletClient.signMessage({
        account,
        message,
      });
      return hexToBytes(signature);
    },
  };
}

export async function canRecipientMessage(
  toAddress: string,
  env?: XmtpEnv,
): Promise<boolean> {
  const identifier = {
    identifier: toAddress.toLowerCase(),
    identifierKind: IdentifierKind.Ethereum,
  };
  const backend = await createBackend({ env: env ?? getXmtpEnv() });
  const result = await Client.canMessage([identifier], backend);
  return result.get(identifier.identifier) ?? false;
}

export async function sendDmJson(
  client: Client<unknown>,
  toAddress: string,
  payload: MezoPayMessage,
): Promise<void> {
  const identifier = {
    identifier: toAddress.toLowerCase(),
    identifierKind: IdentifierKind.Ethereum,
  };

  let dm = await client.conversations.fetchDmByIdentifier(identifier);
  if (!dm) {
    dm = await client.conversations.createDmWithIdentifier(identifier);
  }

  await dm.sendText(JSON.stringify(payload));
}

export type IncomingMessageHandlers = {
  connectedAddress: string;
  onRequestReceived: (amount: number, fromLabel: string) => void;
  onPaymentCompleted: (requestId: string) => void;
  onRequestsUpdated: () => void;
};

export function handleIncomingMessage(
  message: DecodedMessage,
  handlers: IncomingMessageHandlers,
): void {
  if (!isText(message) || typeof message.content !== "string") return;

  const payload = parseMezoPayMessage(message.content);
  if (!payload) return;

  const myAddress = handlers.connectedAddress.toLowerCase();

  if (payload.type === "mezopay_request") {
    if (payload.toAddress.toLowerCase() !== myAddress) return;

    const record = requestMessageToRecord(payload);
    upsertRequest(record);

    const fromLabel = payload.fromUsername
      ? `@${payload.fromUsername}`
      : `${payload.fromAddress.slice(0, 6)}...${payload.fromAddress.slice(-4)}`;
    handlers.onRequestReceived(payload.amount, fromLabel);
    handlers.onRequestsUpdated();
    return;
  }

  if (payload.type === "mezopay_payment_completed") {
    const existing = loadRequests().find(
      (r) => r.id === payload.requestId && r.fromAddress.toLowerCase() === myAddress,
    );
    if (!existing) return;

    updateRequestStatus(payload.requestId, "accepted");
    handlers.onPaymentCompleted(payload.requestId);
    handlers.onRequestsUpdated();
  }
}
