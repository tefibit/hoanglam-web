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
        Số và giá SIM cập nhật từ kho cửa hàng · Gói cước và đặt mua trực tuyến đang thử nghiệm, nhân
        viên sẽ liên hệ xác nhận.
      </div>
      <main>
        <SimShop />
      </main>
    </>
  );
}
