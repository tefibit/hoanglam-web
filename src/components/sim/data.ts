// Dữ liệu minh họa của trang chủ (theo bản mẫu sodepviettel.html) — số,
// mệnh, giá và gói cước CHƯA phải kho số đang bán. Sau này thay bằng API.

export type SimElement = "Kim" | "Mộc" | "Thuỷ" | "Hoả" | "Thổ";

export interface SimEntry {
  id: number;
  number: string;
  price: number;
  type: string;
  element: SimElement;
}

const ELEMENTS_CYCLE: SimElement[] = ["Hoả", "Kim", "Mộc", "Thuỷ", "Thổ"];

export const SIM_ENTRIES: SimEntry[] = (
  [
    ["0981236868", 1250000, "Lộc phát"],
    ["0868889999", 8900000, "Tứ quý"],
    ["0971030303", 650000, "Số lặp"],
    ["0981030303", 950000, "Số lặp"],
    ["0962468888", 6500000, "Tứ quý"],
    ["0335671985", 350000, "Năm sinh"],
    ["0382466789", 1750000, "Số tiến"],
    ["0974566666", 5200000, "Tứ quý"],
    ["0347891990", 450000, "Năm sinh"],
    ["0392348888", 2800000, "Tứ quý"],
    ["0985677979", 2200000, "Thần tài"],
    ["0862345678", 3800000, "Số tiến"],
    ["0356786868", 550000, "Lộc phát"],
    ["0967893333", 3200000, "Tứ quý"],
    ["0381231982", 300000, "Năm sinh"],
    ["0975678989", 1150000, "Số cặp"],
    ["0983459999", 9900000, "Tứ quý"],
    ["0334567777", 1950000, "Tứ quý"],
  ] as const
).map(([number, price, type], i) => ({
  id: i,
  number,
  price,
  type,
  element: ELEMENTS_CYCLE[i % 5],
}));

export interface Plan {
  id: string;
  name: string;
  price: number;
  term?: string;
  tag?: string;
  info: string;
}

export const PLANS: Plan[] = [
  { id: "none", name: "Chưa chọn gói", price: 0, info: "Không cộng tiền gói cước." },
  { id: "6M5G125", name: "6M5G125 · 750.000 đ / 180 ngày", price: 750000, term: "180 ngày · 6 chu kỳ", info: "150GB mỗi chu kỳ 30 ngày. Nhân viên xác nhận số SIM đủ điều kiện đăng ký." },
  { id: "12M5G125", name: "12M5G125 · 1.500.000 đ / 360 ngày", price: 1500000, term: "360 ngày · 12 chu kỳ", info: "150GB mỗi chu kỳ 30 ngày. Nhân viên xác nhận số SIM đủ điều kiện đăng ký." },
  { id: "12V200B", name: "12V200B · 2.400.000 đ / 360 ngày", price: 2400000, term: "360 ngày", tag: "GÓI 360 NGÀY", info: "8GB/ngày · 1.200 phút ngoại mạng." },
  { id: "12T5G230B", name: "12T5G230B · 2.760.000 đ / 360 ngày", price: 2760000, term: "360 ngày", tag: "GÓI 360 NGÀY", info: "8GB/ngày · 1.800 phút ngoại mạng. Tiện ích: TV360, MCA." },
  { id: "12T5G280B", name: "12T5G280B · 3.360.000 đ / 360 ngày", price: 3360000, term: "360 ngày", tag: "GÓI 360 NGÀY", info: "10GB/ngày · 2.400 phút ngoại mạng. Tiện ích: TV360, MCA." },
  { id: "12T5G330B", name: "12T5G330B · 3.960.000 đ / 360 ngày", price: 3960000, term: "360 ngày", tag: "GÓI 360 NGÀY", info: "12GB/ngày · 3.600 phút ngoại mạng. Tiện ích: TV360, MCA." },
  { id: "12T5G380B", name: "12T5G380B · 4.560.000 đ / 360 ngày", price: 4560000, term: "360 ngày", tag: "GÓI 360 NGÀY", info: "15GB/ngày · 3.600 phút ngoại mạng. Tiện ích: TV360, MCA." },
  { id: "12T5G480B", name: "12T5G480B · 5.760.000 đ / 360 ngày", price: 5760000, term: "360 ngày", tag: "GÓI 360 NGÀY", info: "20GB/ngày · 3.600 phút ngoại mạng. Tiện ích: TV360." },
];

export const SIM_TYPES = [
  { name: "Tất cả", icon: "▦", sub: "Tổng hợp số đẹp" },
  { name: "Lộc phát", icon: "💰", sub: "Phát tài phát lộc" },
  { name: "Thần tài", icon: "👑", sub: "Chiêu tài đón lộc" },
  { name: "Tứ quý", icon: "💎", sub: "Dấu ấn khác biệt" },
  { name: "Số tiến", icon: "📶", sub: "Phát triển thăng tiến" },
  { name: "Số lặp", icon: "🔁", sub: "Dễ nhớ, ấn tượng" },
  { name: "Số cặp", icon: "♥", sub: "Song hỷ, may mắn" },
  { name: "Năm sinh", icon: "📅", sub: "Kỷ niệm ý nghĩa" },
];

export const ELEMENT_ICONS: Record<SimElement, string> = {
  Hoả: "🔥",
  Kim: "⚙️",
  Mộc: "🌿",
  Thuỷ: "💧",
  Thổ: "⛰️",
};

export const ELEMENT_FILTERS = ["all", "Kim", "Mộc", "Thuỷ", "Hoả", "Thổ"] as const;

export const BUDGETS = [
  { value: "all", label: "Tất cả mức giá" },
  { value: "0-500000", label: "Dưới 500 nghìn" },
  { value: "500000-1000000", label: "500 nghìn – 1 triệu" },
  { value: "1000000-3000000", label: "1 – 3 triệu" },
  { value: "3000000-5000000", label: "3 – 5 triệu" },
  { value: "5000000-999999999", label: "Từ 5 triệu" },
];

export const PREFIXES = ["098", "097", "096", "086", "033", "034", "035", "038", "039"];

export const STORES = ["Nguyễn Trãi", "Kim Giang", "Nguyễn Khang", "Linh Đàm", "Times City", "Quan Hoa"];

export const ARTICLES = [
  {
    title: "Chọn số theo cách của bạn",
    summary: "Tìm đuôi số quen thuộc, số lặp, lộc phát hoặc năm sinh; so sánh các số trong cùng ngân sách.",
    detailTitle: "Cách chọn số dễ nhớ",
    detail: "Bắt đầu với ngân sách, sau đó tìm một dãy số quen thuộc. Dùng bộ lọc đầu số và nhóm số, lưu số yêu thích hoặc chọn tối đa 3 số để so sánh. Mệnh của số trong demo là dữ liệu minh họa.",
  },
  {
    title: "SIM vật lý hay eSIM?",
    summary: "Chọn hình thức SIM phù hợp với điện thoại và nhu cầu sử dụng của bạn.",
    detailTitle: "SIM vật lý và eSIM",
    detail: "SIM vật lý dùng thẻ SIM; eSIM cần điện thoại hỗ trợ. Khi đặt mua, chọn hình thức phù hợp và để nhân viên xác nhận khả năng sử dụng trên thiết bị.",
  },
  {
    title: "Chọn thêm gói data",
    summary: "Xem gói riêng và tổng tiền trước khi gửi yêu cầu tư vấn.",
    detailTitle: "Chọn gói cước",
    detail: "Gói cước được chọn riêng. Màn hình chi tiết hiển thị giá SIM, giá gói và tổng tiền. Thông tin gói hiện là dữ liệu demo cần xác nhận trước khi đăng ký.",
  },
];

export const POLICIES: Record<"buy" | "delivery" | "privacy" | "terms", [string, string]> = {
  buy: ["Hướng dẫn đặt mua", "Tìm số → chọn mua → chọn gói tùy nhu cầu → nhập thông tin → tạo đơn demo. Nhân viên cần xác nhận tồn kho và điều kiện đăng ký trước khi bán thật."],
  delivery: ["Giao nhận và thanh toán", "Chọn nhận tại cửa hàng hoặc giao tận nơi trong biểu mẫu. Demo chưa thu tiền; phí giao hàng và phương thức thanh toán sẽ được xác nhận trước khi bán thật."],
  privacy: ["Chính sách bảo mật bản demo", "Thông tin đơn demo và số yêu thích được lưu trong trình duyệt trên thiết bị của bạn. Demo không gửi dữ liệu tới cửa hàng. Không nhập giấy tờ định danh hoặc thông tin thanh toán."],
  terms: ["Điều kiện sử dụng bản demo", "Số điện thoại, mệnh, giá và gói cước phục vụ thử giao diện. Chưa thể giữ số, đăng ký thuê bao hoặc thanh toán thực tế."],
};

export const money = (n: number) => n.toLocaleString("vi-VN") + " đ";
export const formatNumber = (n: string) => `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
