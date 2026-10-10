import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// Add each public route here (and dynamic ones, e.g. products, later).
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/"];

  return routes.map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
