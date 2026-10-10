// Site-wide constants used for SEO (metadata, sitemap, robots, JSON-LD).
export const siteConfig = {
  name: "Số Đẹp Viettel",
  shortName: "Số Đẹp Viettel",
  description:
    "Chọn SIM số đẹp Viettel tại hệ thống cửa hàng Hoàng Lâm: tìm theo đuôi số, năm sinh, phong thủy, so sánh giá và chọn gói cước 5G.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003").replace(/\/$/, ""),
  locale: "vi_VN",
  keywords: [
    "Hoàng Lâm",
    "số đẹp Viettel",
    "sim phong thủy",
    "sim năm sinh",
    "gói cước 5G Viettel",
    "sim số đẹp",
    "sim Viettel",
    "thẻ cào",
    "phụ kiện điện thoại",
    "cửa hàng Viettel",
  ],
};
