import Link from "next/link";
import { formatPostDate, getPosts, postPath, type PostType } from "@/lib/api/content";

const PAGE_SIZE = 12;

interface PostListProps {
  type: PostType;
  // List page the pagination links point to, e.g. "/tin-tuc".
  basePath: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  emptyText: string;
}

// Paginated grid of posts (thumbnail, title, summary). Reads ?page=, so it
// renders at request time inside the page's <Suspense>.
export async function PostList({ type, basePath, searchParams, emptyText }: PostListProps) {
  const rawPage = (await searchParams).page;
  const page = Math.max(1, Number.parseInt(String(Array.isArray(rawPage) ? rawPage[0] : (rawPage ?? "1")), 10) || 1);
  const { data: posts, pagination } = await getPosts({ type, page, limit: PAGE_SIZE });

  if (posts.length === 0) {
    return (
      <div className="empty">
        <p>{page > 1 ? "Không còn bài viết nào." : emptyText}</p>
        {page > 1 && (
          <Link href={basePath} className="secondary" style={{ display: "inline-block", marginTop: 15 }}>
            Về trang đầu
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="post-grid">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <Link href={postPath(post)} className="post-thumb" aria-hidden tabIndex={-1}>
              {post.thumbnailUrl ? (
                // Images come from the admin's media storage (any host).
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.thumbnailUrl} alt="" loading="lazy" />
              ) : (
                <span>sốđẹp<b>viettel</b></span>
              )}
            </Link>
            <div className="post-body">
              {formatPostDate(post.publishedAt) && <time>{formatPostDate(post.publishedAt)}</time>}
              <h2>
                <Link href={postPath(post)}>{post.title}</Link>
              </h2>
              {post.summary && <p>{post.summary}</p>}
              <Link href={postPath(post)} className="read-more">
                Xem chi tiết →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {pagination.total_pages > 1 && (
        <nav className="pager" aria-label="Phân trang">
          {Array.from({ length: pagination.total_pages }, (_, index) => index + 1).map((number) => (
            <Link
              key={number}
              href={number === 1 ? basePath : `${basePath}?page=${number}`}
              aria-current={number === page ? "page" : undefined}
              className={number === page ? "active" : undefined}
            >
              {number}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
