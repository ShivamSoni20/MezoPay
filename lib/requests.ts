export const STORAGE_KEY = "mezopay_requests";

export type MezoPayRequestStatus = "pending" | "accepted" | "declined";

export interface MezoPayRequest {
  id: string;
  fromAddress: string;
  fromUsername: string;
  toAddress: string;
  toUsername: string;
  amount: number;
  note: string;
  timestamp: number;
  status: MezoPayRequestStatus;
}

export type MezoPayRequestMessage = {
  type: "mezopay_request";
  id: string;
  fromAddress: string;
  fromUsername: string;
  toAddress: string;
  toUsername?: string;
  amount: number;
  note: string;
  timestamp: number;
};

export type MezoPayPaymentCompletedMessage = {
  type: "mezopay_payment_completed";
  requestId: string;
  fromAddress: string;
  timestamp: number;
};

export type MezoPayMessage = MezoPayRequestMessage | MezoPayPaymentCompletedMessage;

export function notifyRequestsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mezopay_requests_updated"));
}

export function loadRequests(): MezoPayRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MezoPayRequest[];
  } catch {
    return [];
  }
}

function saveRequests(requests: MezoPayRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  notifyRequestsUpdated();
}

export function upsertRequest(request: MezoPayRequest): void {
  const requests = loadRequests();
  const idx = requests.findIndex((r) => r.id === request.id);
  if (idx >= 0) {
    requests[idx] = request;
  } else {
    requests.push(request);
  }
  saveRequests(requests);
}

export function updateRequestStatus(id: string, status: MezoPayRequestStatus): void {
  const requests = loadRequests();
  const updated = requests.map((r) => (r.id === id ? { ...r, status } : r));
  saveRequests(updated);
}

export function getRequestById(id: string): MezoPayRequest | undefined {
  return loadRequests().find((r) => r.id === id);
}

export function parseMezoPayMessage(text: string): MezoPayMessage | null {
  try {
    const parsed = JSON.parse(text) as { type?: string };
    if (parsed.type === "mezopay_request") {
      const msg = parsed as MezoPayRequestMessage;
      if (
        typeof msg.id === "string" &&
        typeof msg.fromAddress === "string" &&
        typeof msg.toAddress === "string" &&
        typeof msg.amount === "number"
      ) {
        return msg;
      }
    }
    if (parsed.type === "mezopay_payment_completed") {
      const msg = parsed as MezoPayPaymentCompletedMessage;
      if (
        typeof msg.requestId === "string" &&
        typeof msg.fromAddress === "string"
      ) {
        return msg;
      }
    }
  } catch {
    // not JSON
  }
  return null;
}

export function requestMessageToRecord(msg: MezoPayRequestMessage): MezoPayRequest {
  return {
    id: msg.id,
    fromAddress: msg.fromAddress.toLowerCase(),
    fromUsername: msg.fromUsername || "",
    toAddress: msg.toAddress.toLowerCase(),
    toUsername: msg.toUsername || "",
    amount: msg.amount,
    note: msg.note || "Quick Request",
    timestamp: msg.timestamp,
    status: "pending",
  };
}
