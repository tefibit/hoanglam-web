"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useShopUi } from "@/components/sim/ShopUiContext";
import { GREETING, replyTo, type BotAction, type BotReply } from "./bot";

interface Message extends BotReply {
  id: number;
  from: "bot" | "user";
}

const TYPING_MS = 600;

// Floating "Tư vấn chọn số" chat. Answers come from the hard-coded rules
// in ./bot for now.
export function ChatWidget() {
  const { sendCommand } = useShopUi();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "bot", ...GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Instant: a smooth scroll gets cancelled when an action scrolls the page.
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const ask = (text: string) => {
    const message = text.trim();
    if (!message || typing) return;
    setMessages((prev) => [...prev, { id: nextId.current++, from: "user", text: message }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId.current++, from: "bot", ...replyTo(message) }]);
      setTyping(false);
    }, TYPING_MS);
  };

  const runAction = (action: BotAction) => {
    if (action.ask) {
      ask(action.ask);
      return;
    }
    if (action.command) {
      sendCommand(action.command);
      if (pathname !== "/") router.push("/#chon-so");
      else document.getElementById("chon-so")?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Let the visitor see the list on small screens.
      if (window.matchMedia("(max-width: 640px)").matches) setOpen(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(input);
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
              <small>Trợ lý Hoàng Lâm · trả lời tự động</small>
            </div>
            <button type="button" className="chat-close" aria-label="Đóng" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="chat-messages" ref={listRef} aria-live="polite">
            {messages.map((message, index) => (
              <div key={message.id} className={`chat-msg ${message.from}`}>
                <p>{message.text}</p>
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
              placeholder="Nhập câu hỏi hoặc đuôi số…"
              aria-label="Nội dung tin nhắn"
              maxLength={300}
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
