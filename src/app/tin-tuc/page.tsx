import type { Metadata } from "next";
import { Suspense } from "react";
import { PLAN_TOPIC } from "@/lib/api/content";
import { PageHeading } from "@/components/content/PageHeading";
import { PostList } from "@/components/content/PostList";

export const metadata: Metadata = {
  title: "Tin tức",
  description: "Tin tức, khuyến mãi và cẩm nang chọn SIM số đẹp Viettel từ hệ thống cửa hàng Hoàng Lâm.",
  alternates: { canonical: "/tin-tuc" },
};

export default function NewsPage(props: PageProps<"/tin-tuc">) {
  return (
    <main className="page">
      <PageHeading
        eyebrow="TIN TỨC"
        title="Tin tức & cẩm nang"
        description="Khuyến mãi, tin Viettel và kinh nghiệm chọn số đẹp."
        trail={[{ label: "Tin tức" }]}
      />
      <Suspense fallback={<div className="empty"><p>Đang tải tin tức…</p></div>}>
        <PostList
          excludeTopic={PLAN_TOPIC}
          basePath="/tin-tuc"
          searchParams={props.searchParams}
          emptyText="Chưa có tin tức nào."
        />
      </Suspense>
    </main>
  );
}
