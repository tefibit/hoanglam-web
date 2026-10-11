import { cacheLife } from "next/cache";

// Server-side reads of website content (tin tức, gói cước, chi nhánh) from
// hoanglam-api, cached so the pages are prerendered and refreshed every few
// minutes. A failed call returns an empty result instead of breaking the
// build or the page; it is retried when the cache entry revalidates.

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

// "Loại bài viết": NEWS → /tin-tuc, PLAN (gói cước 5G) → /goi-cuoc.
export type PostType = "NEWS" | "PLAN";

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  thumbnailUrl: string | null;
  postType: PostType;
  topic: string | null;
  publishedAt: string | null;
}

export interface Post extends PostSummary {
  content: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

export interface PostPage {
  data: PostSummary[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface WebStore {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  workingHours: string | null;
  mapUrl: string | null;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}${path}`);
    if (!response.ok) {
      if (response.status !== 404) console.error(`[content] GET ${path} → ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[content] GET ${path} failed`, error);
    return null;
  }
}

export async function getPosts(options: { type?: PostType; page?: number; limit?: number }) {
  "use cache";
  cacheLife("minutes");

  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (options.type) query.set("type", options.type);

  const body = await getJson<PostPage>(`/web/posts?${query}`);
  return body ?? { data: [], pagination: { page, limit, total: 0, total_pages: 0 } };
}

export async function getPost(slug: string) {
  "use cache";
  cacheLife("minutes");

  const body = await getJson<{ data: Post }>(`/web/posts/${encodeURIComponent(slug)}`);
  return body?.data ?? null;
}

export async function getStores() {
  "use cache";
  cacheLife("minutes");

  const body = await getJson<{ data: WebStore[] }>("/web/stores");
  return body?.data ?? [];
}

// Where a post lives on the site.
export const postPath = (post: Pick<PostSummary, "slug" | "postType">) =>
  `${post.postType === "PLAN" ? "/goi-cuoc" : "/tin-tuc"}/${post.slug}`;

export const formatPostDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : null;
