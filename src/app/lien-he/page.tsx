import type { Metadata } from "next";
import { getStores, type WebStore } from "@/lib/api/content";
import { PageHeading } from "@/components/content/PageHeading";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Địa chỉ, số điện thoại, giờ làm việc và bản đồ các chi nhánh cửa hàng Viettel Hoàng Lâm.",
  alternates: { canonical: "/lien-he" },
};

const HOTLINE = process.env.NEXT_PUBLIC_HOTLINE?.trim() ?? "";

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

// The map frame searches the address (works without an API key); an admin
// "Google Maps" link may be a short link that can't be embedded, so it is
// used for the "Chỉ đường" button instead — unless it already is an embed URL.
function mapEmbedUrl(store: WebStore) {
  if (store.mapUrl?.includes("/maps/embed")) return store.mapUrl;
  if (!store.address) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${store.address}, Hà Nội`)}&z=16&output=embed`;
}

function directionsUrl(store: WebStore) {
  if (store.mapUrl && !store.mapUrl.includes("/maps/embed")) return store.mapUrl;
  if (!store.address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.address}, Hà Nội`)}`;
}

export default async function ContactPage() {
  const stores = await getStores();

  return (
    <main className="page">
      <PageHeading
        eyebrow="LIÊN HỆ"
        title="Hệ thống cửa hàng Hoàng Lâm"
        description="Ghé chi nhánh gần nhất để chọn số, đăng ký gói cước và được hỗ trợ trực tiếp."
        trail={[{ label: "Liên hệ" }]}
      />

      {HOTLINE && (
        <div className="contact-hotline">
          Hotline tư vấn: <a href={telHref(HOTLINE)}>{HOTLINE}</a>
        </div>
      )}

      {stores.length === 0 ? (
        <div className="empty">
          <p>Thông tin chi nhánh đang được cập nhật.</p>
        </div>
      ) : (
        <div className="store-grid">
          {stores.map((store) => {
            const embed = mapEmbedUrl(store);
            const directions = directionsUrl(store);
            return (
              <article key={store.id} className="store-card">
                <div className="store-map">
                  {embed ? (
                    <iframe
                      src={embed}
                      title={`Bản đồ ${store.name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <span>Chưa có bản đồ</span>
                  )}
                </div>
                <div className="store-info">
                  <h2>{store.name}</h2>
                  <dl>
                    <div>
                      <dt>Địa chỉ</dt>
                      <dd>{store.address || "Đang cập nhật"}</dd>
                    </div>
                    <div>
                      <dt>Điện thoại</dt>
                      <dd>{store.phone ? <a href={telHref(store.phone)}>{store.phone}</a> : "Đang cập nhật"}</dd>
                    </div>
                    <div>
                      <dt>Giờ làm việc</dt>
                      <dd>{store.workingHours || "Đang cập nhật"}</dd>
                    </div>
                  </dl>
                  <div className="store-actions">
                    {store.phone && (
                      <a className="primary" href={telHref(store.phone)}>
                        Gọi cửa hàng
                      </a>
                    )}
                    {directions && (
                      <a className="secondary" href={directions} target="_blank" rel="noopener noreferrer">
                        Chỉ đường
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
