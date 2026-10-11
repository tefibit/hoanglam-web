import { Suspense } from "react";
import { PostDetail, postMetadata, postStaticParams } from "@/components/content/PostDetail";

export function generateStaticParams() {
  return postStaticParams("tin-tuc");
}

export async function generateMetadata(props: PageProps<"/tin-tuc/[slug]">) {
  const { slug } = await props.params;
  return postMetadata(slug);
}

export default function NewsDetailPage(props: PageProps<"/tin-tuc/[slug]">) {
  return (
    <main className="page">
      <Suspense fallback={<div className="empty"><p>Đang tải bài viết…</p></div>}>
        <PostDetail params={props.params} section="tin-tuc" />
      </Suspense>
    </main>
  );
}
