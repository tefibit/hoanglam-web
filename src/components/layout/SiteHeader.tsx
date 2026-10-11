"use client";

import Link from "next/link";
import { useShopUi, type ShopMode } from "@/components/sim/ShopUiContext";

const MODES: { value: ShopMode; label: string }[] = [
  { value: "customer", label: "Khách chọn số" },
  { value: "kiosk", label: "Màn hình cửa hàng" },
  { value: "staff", label: "Nhân viên tư vấn" },
];

export function Brand() {
  return (
    <div className="brand">
      sốđẹp<b>viettel</b>
      <small>HOÀNG LÂM · SODEPVIETTEL.VN</small>
    </div>
  );
}

export function SiteHeader() {
  const { mode, setMode, sendCommand } = useShopUi();

  return (
    <header>
      <Link href="/" onClick={() => sendCommand({ kind: "reset" })} aria-label="Số đẹp Viettel — Trang chủ" style={{ color: "inherit", textDecoration: "none" }}>
        <Brand />
      </Link>
      <nav className="links" aria-label="Menu chính">
        <Link href="/" onClick={() => sendCommand({ kind: "reset" })}>
          Trang chủ
        </Link>
        <Link href="/#chon-so">Chọn số đẹp</Link>
        <Link href="/#chon-so" onClick={() => sendCommand({ kind: "focusElement" })}>
          SIM phong thủy
        </Link>
        <Link href="/#chon-so" onClick={() => sendCommand({ kind: "type", value: "NAM_SINH" })}>
          SIM năm sinh
        </Link>
        <Link href="/#goi-cuoc">Gói cước 5G</Link>
        <Link href="/#tin-tuc">Tin tức</Link>
        <Link href="#lien-he">Liên hệ</Link>
      </nav>
      <nav className="modes" aria-label="Chế độ hiển thị">
        {MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            className={mode === item.value ? "active" : undefined}
            aria-pressed={mode === item.value}
            onClick={() => setMode(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
