import type { Metadata } from "next";
import { SimShop } from "@/components/sim/SimShop";

export const metadata: Metadata = {
  title: "Sim phong thủy",
  description: "Chọn SIM phong thủy hợp mệnh: nhập ngày sinh và giới tính để biết mệnh ngũ hành và xem các số hợp mệnh.",
  alternates: { canonical: "/sim-phong-thuy" },
};

export default function SimPhongThuyPage() {
  return (
    <main>
      <SimShop
        initialType="PHONG_THUY"
        eyebrow="SIM PHONG THỦY"
        title="Sim hợp mệnh theo tuổi"
        subtitle="Nhập ngày sinh và giới tính, hệ thống tính mệnh ngũ hành (theo năm âm lịch) và lọc số hợp mệnh."
        showGuides={false}
      />
    </main>
  );
}
