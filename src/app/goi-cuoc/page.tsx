import type { Metadata } from "next";
import { Suspense } from "react";
import { PLAN_TOPIC } from "@/lib/api/content";
import { PageHeading } from "@/components/content/PageHeading";
import { PostList } from "@/components/content/PostList";

export const metadata: Metadata = {
  title: "Gói cước 5G",
  description: "Các gói cước 5G, gói data Viettel đăng ký tại hệ thống cửa hàng Hoàng Lâm.",
  alternates: { canonical: "/goi-cuoc" },
};

export default function PlansPage(props: PageProps<"/goi-cuoc">) {
  return (
    <main className="page">
      <PageHeading
        eyebrow="GÓI CƯỚC VIETTEL"
        title="Gói cước 5G"
        description="Chọn gói data, gói 5G phù hợp. Nhân viên cửa hàng xác nhận điều kiện đăng ký."
        trail={[{ label: "Gói cước 5G" }]}
      />
      <Suspense fallback={<div className="empty"><p>Đang tải gói cước…</p></div>}>
        <PostList
          topic={PLAN_TOPIC}
          basePath="/goi-cuoc"
          searchParams={props.searchParams}
          emptyText="Chưa có gói cước nào được đăng."
        />
      </Suspense>
    </main>
  );
}
