import type { Metadata } from "next";
import Image from "next/image";
import { SimShop } from "@/components/sim/SimShop";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Image
        className="hero"
        src="/images/hero-so-dep-viettel.jpg"
        alt="Chọn số đẹp Viettel, khẳng định dấu ấn riêng"
        width={1672}
        height={215}
        priority
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
      />
      <div className="demo">
        Bản mẫu giao diện · Số, mệnh, giá và gói cước là dữ liệu minh họa, chưa phải kho số đang bán.
      </div>
      <main>
        <SimShop />
      </main>
    </>
  );
}
