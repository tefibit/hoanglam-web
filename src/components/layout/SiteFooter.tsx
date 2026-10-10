"use client";

import Link from "next/link";
import { POLICIES, STORES } from "@/components/sim/data";
import { useShopUi } from "@/components/sim/ShopUiContext";
import { OrdersModal } from "@/components/sim/OrdersModal";
import { Brand } from "./SiteHeader";

export function SiteFooter() {
  const { openModal, closeModal, orders, sendCommand } = useShopUi();

  const policy = (key: keyof typeof POLICIES) =>
    openModal(
      <>
        <h2>{POLICIES[key][0]}</h2>
        <p>{POLICIES[key][1]}</p>
      </>,
    );

  const contactForm = () =>
    openModal(
      <>
        <h2>Liên hệ tư vấn</h2>
        <p>
          Chọn số và tạo đơn demo để xem quy trình tư vấn. Hotline và địa chỉ chi tiết sẽ được cập
          nhật khi có thông tin chính thức.
        </p>
        <Link href="/#chon-so" className="primary" onClick={closeModal} style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}>
          Chọn số ngay
        </Link>
      </>,
    );

  return (
    <footer className="site-footer" id="lien-he">
      <div>
        <Brand />
        <p>
          Hệ thống cửa hàng giao dịch Viettel Hoàng Lâm.
          <br />
          SIM số đẹp · eSIM · Gói cước · Hỗ trợ khách hàng.
        </p>
        <p>Bản demo tương tác. Thông tin số và giá minh họa.</p>
      </div>
      <div>
        <h3>HỆ THỐNG CỬA HÀNG</h3>
        <p>
          {STORES.slice(0, 2).join(" · ")}
          <br />
          {STORES.slice(2, 4).join(" · ")}
          <br />
          {STORES.slice(4).join(" · ")}
        </p>
        <button type="button" className="secondary" onClick={contactForm}>
          Yêu cầu tư vấn
        </button>
      </div>
      <div>
        <h3>HỖ TRỢ KHÁCH HÀNG</h3>
        <a href="#" onClick={(e) => { e.preventDefault(); policy("buy"); }}>Hướng dẫn đặt mua</a>
        <a href="#" onClick={(e) => { e.preventDefault(); policy("delivery"); }}>Giao nhận và thanh toán</a>
        <a href="#" onClick={(e) => { e.preventDefault(); policy("privacy"); }}>Chính sách bảo mật</a>
        <a href="#" onClick={(e) => { e.preventDefault(); policy("terms"); }}>Điều kiện sử dụng</a>
      </div>
      <div>
        <h3>TIỆN ÍCH</h3>
        <Link href="/#chon-so" onClick={() => sendCommand({ kind: "favorites" })}>Số yêu thích</Link>
        <a href="#" onClick={(e) => { e.preventDefault(); openModal(<OrdersModal orders={orders} />); }}>Đơn demo của bạn</a>
        <Link href="/#goi-cuoc">Gói cước Viettel</Link>
        <p>© Hoàng Lâm · Số đẹp Viettel</p>
      </div>
    </footer>
  );
}
