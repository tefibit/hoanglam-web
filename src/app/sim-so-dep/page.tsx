import type { Metadata } from "next";
import { SimShop } from "@/components/sim/SimShop";

export const metadata: Metadata = {
  title: "Chọn số đẹp",
  description: "Tìm SIM số đẹp Viettel theo đuôi số, đầu số, loại số (tứ quý, lộc phát, thần tài…) và mức giá.",
  alternates: { canonical: "/sim-so-dep" },
};

export default function SimSoDepPage() {
  return (
    <main>
      <SimShop
        eyebrow="CHỌN SỐ ĐẸP"
        title="Kho sim số đẹp Viettel"
        subtitle="Tìm theo đuôi số, đầu số, loại số đẹp và mức giá phù hợp."
        showGuides={false}
      />
    </main>
  );
}
