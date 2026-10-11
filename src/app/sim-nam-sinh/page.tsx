import type { Metadata } from "next";
import { SimShop } from "@/components/sim/SimShop";

export const metadata: Metadata = {
  title: "Sim năm sinh",
  description: "Tìm SIM Viettel có đuôi là năm sinh của bạn: nhập ngày tháng năm sinh và giới tính để xem số phù hợp.",
  alternates: { canonical: "/sim-nam-sinh" },
};

export default function SimNamSinhPage() {
  return (
    <main>
      <SimShop
        initialType="NAM_SINH"
        eyebrow="SIM NĂM SINH"
        title="Sim đuôi năm sinh"
        subtitle="Nhập ngày tháng năm sinh và giới tính để tìm các số kết thúc bằng năm sinh của bạn."
        showGuides={false}
      />
    </main>
  );
}
