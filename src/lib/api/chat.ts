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

export async function askAdvisor(history: ChatTurn[]) {
  const { data } = await apiClient.post<ApiResponse<ChatAnswer>>(
    "/web/chat",
    { messages: history.slice(-HISTORY_TURNS) },
    // The model may search the stock a few times before answering.
    { timeout: 70_000 },
  );
  return data.data;
}
