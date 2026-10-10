# hoanglam-web

Website khách hàng Hoàng Lâm — Next.js 16 (App Router) + TypeScript, tối ưu SEO.

## Công nghệ

- **Next.js 16** (App Router, Turbopack, `cacheComponents`) — trang render sẵn ở server (SSG/ISR) để bot đọc được nội dung.
- **Tailwind CSS 4** — màu thương hiệu `brand-*` khai báo trong `src/app/globals.css`.
- **axios** — `src/lib/api/client.ts` (gọi `hoanglam-api`, chuẩn hoá lỗi thành `ApiError`).
- **TanStack Query** — `src/lib/query-client.ts`, provider ở `src/app/providers.tsx` (Devtools chỉ bật khi dev).
- **react-icons**.

## Chạy

```bash
cp .env.example .env.local   # sửa NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_SITE_URL
npm install
npm run dev                  # http://localhost:3003
npm run build && npm start   # production
npm run lint && npm run typecheck
```

Cổng **3003** nằm trong danh sách CORS của `hoanglam-api`.

> Ổ ngoài macOS tạo các file `._*`; nếu build báo `Failed to open database` thì chạy `npm run clean` rồi build lại.

## SEO

- `src/app/layout.tsx`: `metadataBase`, title template, description, keywords, canonical, Open Graph, Twitter, robots, `lang="vi"`, font Be Vietnam Pro (subset `vietnamese`), JSON-LD `Organization`.
- `src/app/sitemap.ts` → `/sitemap.xml`, `src/app/robots.ts` → `/robots.txt` — thêm route mới vào `sitemap.ts`.
- Mỗi trang khai báo `metadata` / `generateMetadata` riêng (title dùng template `%s | Hoàng Lâm`).
- Lấy dữ liệu cho SEO ở **Server Component** (fetch phía server); TanStack Query dùng cho phần tương tác phía client (xem hướng dẫn `node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md`).

## Cấu trúc

```
src/
  app/            layout, page, providers, sitemap, robots, not-found
  components/     layout/ (SiteHeader, SiteFooter, SiteLogo)
  hooks/          useMediaLinks (logo từ Cài đặt → MEDIALINK)
  lib/            site.ts (cấu hình SEO), api/client.ts, query-client.ts
```
