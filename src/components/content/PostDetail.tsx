import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPostDate, getPost, getPosts, postPath, PLAN_TOPIC } from "@/lib/api/content";
import { siteConfig } from "@/lib/site";
import { PageHeading } from "./PageHeading";

export type PostSection = "tin-tuc" | "goi-cuoc";

const SECTIONS: Record<PostSection, { label: string; href: string }> = {
  "tin-tuc": { label: "Tin tức", href: "/tin-tuc" },
  "goi-cuoc": { label: "Gói cước 5G", href: "/goi-cuoc" },
};

const sectionFilter = (section: PostSection) =>
  section === "goi-cuoc" ? { topic: PLAN_TOPIC } : { excludeTopic: PLAN_TOPIC };

// Slugs prerendered at build time (newest posts). Cache Components needs at
// least one, so an empty list gets a placeholder that renders a 404.
export async function postStaticParams(section: PostSection) {
  const { data } = await getPosts({ ...sectionFilter(section), limit: 20 });
  return data.length > 0 ? data.map((post) => ({ slug: post.slug })) : [{ slug: "__placeholder__" }];
}

export async function postMetadata(slug: string): Promise<Metadata> {
  const post = await getPost(slug);
  if (!post) return { title: "Không tìm thấy bài viết" };

  const description = post.seoDescription ?? post.summary ?? siteConfig.description;
  return {
    title: post.seoTitle ?? post.title,
    description,
    alternates: { canonical: postPath(post) },
    openGraph: {
      type: "article",
      url: postPath(post),
      title: post.seoTitle ?? post.title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      images: post.thumbnailUrl ? [{ url: post.thumbnailUrl }] : undefined,
    },
  };
}

export async function PostDetail({ params, section }: { params: Promise<{ slug: string }>; section: PostSection }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const home = SECTIONS[section];
  const related = (await getPosts({ ...sectionFilter(section), limit: 4 })).data
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  return (
    <>
      <PageHeading
        eyebrow={home.label.toUpperCase()}
        title={post.title}
        trail={[{ label: home.label, href: home.href }, { label: post.title }]}
      />
      <article className="post-detail">
        {formatPostDate(post.publishedAt) && <time>Đăng ngày {formatPostDate(post.publishedAt)}</time>}
        {post.summary && <p className="post-summary">{post.summary}</p>}
        {post.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="post-cover" src={post.thumbnailUrl} alt={post.title} />
        )}
        {/* Rich text written by staff in the admin editor. */}
        <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
      </article>

      {related.length > 0 && (
        <section className="post-related" aria-label="Bài viết khác">
          <h2>Bài viết khác</h2>
          <ul>
            {related.map((item) => (
              <li key={item.id}>
                <Link href={postPath(item)}>{item.title}</Link>
              </li>
            ))}
          </ul>
          <Link href={home.href} className="secondary" style={{ display: "inline-block", marginTop: 10 }}>
            ← Tất cả {home.label.toLowerCase()}
          </Link>
        </section>
      )}
    </>
  );
}
