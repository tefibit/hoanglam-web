import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getPosts, postPath } from "@/lib/api/content";

const PAGES: { path: string; changeFrequency: "daily" | "weekly"; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/sim-so-dep", changeFrequency: "daily", priority: 0.9 },
  { path: "/sim-phong-thuy", changeFrequency: "daily", priority: 0.9 },
  { path: "/sim-nam-sinh", changeFrequency: "daily", priority: 0.9 },
  { path: "/goi-cuoc", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tin-tuc", changeFrequency: "daily", priority: 0.8 },
  { path: "/lien-he", changeFrequency: "weekly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, plans] = await Promise.all([
    getPosts({ type: "NEWS", limit: 100 }),
    getPosts({ type: "PLAN", limit: 100 }),
  ]);

  return [
    ...PAGES.map((page) => ({
      url: `${siteConfig.url}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...[...news.data, ...plans.data].map((post) => ({
      url: `${siteConfig.url}${postPath(post)}`,
      lastModified: post.publishedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
