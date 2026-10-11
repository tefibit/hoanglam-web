// Floating "Gọi điện" / "Chat Zalo" buttons, bottom-left (the chatbot
// sits bottom-right). Configured by env; a button without a value is hidden.
//   NEXT_PUBLIC_HOTLINE  e.g. 0981234567
//   NEXT_PUBLIC_ZALO     a phone number (→ zalo.me/<phone>) or a full Zalo
//                        link, e.g. an Official Account https://zalo.me/123…

const hotline = (process.env.NEXT_PUBLIC_HOTLINE ?? "").replace(/[^\d+]/g, "");
const zaloValue = (process.env.NEXT_PUBLIC_ZALO ?? "").trim();
const zaloUrl = /^https?:\/\//.test(zaloValue)
  ? zaloValue
  : zaloValue.replace(/\D/g, "")
    ? `https://zalo.me/${zaloValue.replace(/\D/g, "")}`
    : "";

const formatPhone = (phone: string) =>
  phone.length === 10 ? `${phone.slice(0, 4)}.${phone.slice(4, 7)}.${phone.slice(7)}` : phone;

export function ContactButtons() {
  if (!hotline && !zaloUrl) return null;

  return (
    <div className="contact-float" aria-label="Liên hệ nhanh">
      {zaloUrl && (
        <a
          className="contact-btn zalo"
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Nhắn tin Zalo"
        >
          <span className="contact-icon" aria-hidden>
            Zalo
          </span>
          <span className="contact-label">Chat Zalo</span>
        </a>
      )}
      {hotline && (
        <a className="contact-btn phone" href={`tel:${hotline}`} aria-label={`Gọi ${formatPhone(hotline)}`}>
          <span className="contact-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
            </svg>
          </span>
          <span className="contact-label">{formatPhone(hotline)}</span>
        </a>
      )}
    </div>
  );
}
