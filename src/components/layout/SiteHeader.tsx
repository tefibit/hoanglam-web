"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShopUi, type ShopMode } from "@/components/sim/ShopUiContext";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/sim-so-dep", label: "Chọn số đẹp" },
  { href: "/sim-phong-thuy", label: "SIM phong thủy" },
  { href: "/sim-nam-sinh", label: "SIM năm sinh" },
  { href: "/goi-cuoc", label: "Gói cước 5G" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/lien-he", label: "Liên hệ" },
];

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
  const pathname = usePathname();

  return (
    <header>
      <Link href="/" onClick={() => sendCommand({ kind: "reset" })} aria-label="Số đẹp Viettel — Trang chủ" style={{ color: "inherit", textDecoration: "none" }}>
        <Brand />
      </Link>
      <nav className="links" aria-label="Menu chính">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
              onClick={item.href === "/" ? () => sendCommand({ kind: "reset" }) : undefined}
            >
              {item.label}
            </Link>
          );
        })}
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
