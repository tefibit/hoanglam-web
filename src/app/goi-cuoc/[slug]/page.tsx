import { Suspense } from "react";
import { PostDetail, postMetadata, postStaticParams } from "@/components/content/PostDetail";

export function generateStaticParams() {
  return postStaticParams("goi-cuoc");
}

export async function generateMetadata(props: PageProps<"/goi-cuoc/[slug]">) {
  const { slug } = await props.params;
  return postMetadata(slug);
}

export default function PlanDetailPage(props: PageProps<"/goi-cuoc/[slug]">) {
  return (
    <main className="page">
      <Suspense fallback={<div className="empty"><p>Đang tải bài viết…</p></div>}>
        <PostDetail params={props.params} section="goi-cuoc" />
      </Suspense>
    </main>
  );
}
