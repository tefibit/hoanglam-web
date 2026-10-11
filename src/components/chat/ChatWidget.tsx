"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useShopUi } from "@/components/sim/ShopUiContext";
import { formatNumber, priceText } from "@/components/sim/data";
import { ApiError } from "@/lib/api/client";
import { askAdvisor, newChatSessionId, type ChatTurn } from "@/lib/api/chat";
import type { WebSim } from "@/lib/api/sims";
import { GREETING, replyTo, type BotAction, type BotReply } from "./bot";

interface Message extends BotReply {
  id: number;
  from: "bot" | "user";
  sims?: WebSim[];
  error?: boolean;
}

const MAX_LENGTH = 500;

// Floating "Tư vấn chọn số" chat. Answers come from the AI advisor
// (hoanglam-api /web/chat); if it isn't configured or can't be reached,
// the hard-coded rules in ./bot answer instead.
export function ChatWidget() {
  const { sendCommand } = useShopUi();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "bot", ...GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionId] = useState(newChatSessionId);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Instant: a smooth scroll gets cancelled when an action scrolls the page.
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing, open]);

  useEffect(() => {
    if (open && !typing) inputRef.current?.focus();
  }, [open, typing]);

  const push = (message: Omit<Message, "id">) =>
    setMessages((prev) => [...prev, { id: nextId.current++, ...message }]);

  const ask = async (text: string) => {
    const content = text.trim().slice(0, MAX_LENGTH);
    if (!content || typing) return;

    // Earlier turns (greeting included) give the advisor context; failed
    // replies are left out.
    const history: ChatTurn[] = [
      ...messages
        .filter((message) => !message.error)
        .map((message) => ({ role: message.from === "user" ? "user" : "assistant", content: message.text }) as ChatTurn),
      { role: "user", content },
    ];

    push({ from: "user", text: content });
    setInput("");
    setTyping(true);
    try {
      const answer = await askAdvisor(history, sessionId);
      push({ from: "bot", text: answer.reply, sims: answer.sims });
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      if (status === 503 || status === 0 || status === 404) {
        // AI off or unreachable → canned answers keep the chat useful.
        push({ from: "bot", ...replyTo(content) });
      } else {
        push({
          from: "bot",
          text: error instanceof Error ? error.message : "Có lỗi xảy ra, anh/chị thử lại giúp em nhé.",
          error: true,
        });
      }
    } finally {
      setTyping(false);
    }
  };

  const applyCommand = (command: NonNullable<BotAction["command"]>) => {
    sendCommand(command);
    if (pathname !== "/") router.push("/#chon-so");
    else document.getElementById("chon-so")?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Let the visitor see the list on small screens.
    if (window.matchMedia("(max-width: 640px)").matches) setOpen(false);
  };

  const runAction = (action: BotAction) => {
    if (action.ask) void ask(action.ask);
    else if (action.command) applyCommand(action.command);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(input);
  };

  return (
    <div className="chatbot">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Tư vấn chọn số">
          <header>
            <span className="chat-avatar" aria-hidden>
              HL
            </span>
            <div>
              <strong>Tư vấn chọn số</strong>
              <small>Trợ lý AI · thông tin cần nhân viên xác nhận</small>
            </div>
            <button type="button" className="chat-close" aria-label="Đóng" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="chat-messages" ref={listRef} aria-live="polite">
            {messages.map((message, index) => (
              <div key={message.id} className={`chat-msg ${message.from} ${message.error ? "error" : ""}`}>
                <p>{message.text}</p>
                {message.sims && message.sims.length > 0 && (
                  <ul className="chat-sims">
                    {message.sims.map((sim) => (
                      <li key={sim.id}>
                        <div>
                          <b>{formatNumber(sim.phoneNumber)}</b>
                          <small>{priceText(sim.price)}</small>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyCommand({ kind: "search", value: sim.phoneNumber.replace(/\D/g, "") })}
                        >
                          Xem số
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Only the latest bot message keeps its buttons clickable. */}
                {message.actions && message.actions.length > 0 && (
                  <div className="chat-actions">
                    {message.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        disabled={typing || index !== messages.length - 1}
                        onClick={() => runAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="chat-msg bot">
                <p className="chat-typing" aria-label="Đang trả lời">
                  <span />
                  <span />
                  <span />
                </p>
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={submit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về số đẹp, năm sinh, hợp mệnh…"
              aria-label="Nội dung tin nhắn"
              maxLength={MAX_LENGTH}
              disabled={typing}
            />
            <button className="primary" disabled={!input.trim() || typing}>
              Gửi
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat-launcher"
        aria-expanded={open}
        aria-label={open ? "Đóng tư vấn" : "Mở tư vấn chọn số"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "×" : "💬"}
        {!open && <span className="chat-launcher-label">Tư vấn chọn số</span>}
      </button>
    </div>
  );
}
