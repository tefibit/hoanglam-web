import { apiClient, type ApiResponse } from "./client";
import type { WebSim } from "./sims";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAnswer {
  reply: string;
  // Numbers the advisor suggested, shown as cards.
  sims: WebSim[];
}

// The server keeps no chat state; send the recent conversation each time.
const HISTORY_TURNS = 12;

// Groups one conversation's turns in the server's chat history log.
export function newChatSessionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function askAdvisor(history: ChatTurn[], sessionId: string) {
  const { data } = await apiClient.post<ApiResponse<ChatAnswer>>(
    "/web/chat",
    { session_id: sessionId, messages: history.slice(-HISTORY_TURNS) },
    // The model may search the stock a few times before answering.
    { timeout: 70_000 },
  );
  return data.data;
}
