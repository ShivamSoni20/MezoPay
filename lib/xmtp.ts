import {
  Client,
  IdentifierKind,
  createBackend,
  isText,
  type DecodedMessage,
  type Signer,
  type XmtpEnv,
} from "@xmtp/browser-sdk";
import type { WalletClient } from "viem";
import { hexToBytes } from "viem";
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
