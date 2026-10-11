import type { ShopCommand } from "@/components/sim/ShopUiContext";

// Hard-coded advisor for now: keyword rules → canned answers. Swap
// `replyTo` for a call to a real AI endpoint later; the widget only needs
// a BotReply back.

type Command = ShopCommand extends infer C ? (C extends unknown ? Omit<C, "nonce"> : never) : never;

export interface BotAction {
  label: string;
  // Applied to the SIM list on the home page.
  command?: Command;
  // Sent as if the visitor typed it.
  ask?: string;
}

export interface BotReply {
  text: string;
  actions?: BotAction[];
}

export const GREETING: BotReply = {
  text:
    "Xin chào anh/chị 👋 Em là trợ lý chọn số của Hoàng Lâm · Số Đẹp Viettel.\n" +
    "Em có thể giúp anh/chị tìm số theo năm sinh, hợp mệnh, đuôi số may mắn hoặc theo ngân sách. Anh/chị cần tư vấn gì ạ?",
  actions: [
    { label: "📅 Sim năm sinh", ask: "Tôi muốn tìm sim năm sinh" },
    { label: "☯️ Sim hợp mệnh", ask: "Tư vấn sim hợp mệnh" },
    { label: "💰 Lộc phát, thần tài", ask: "Sim lộc phát thần tài" },
    { label: "💎 Tứ quý, ngũ quý", ask: "Sim tứ quý" },
    { label: "📶 Gói cước 5G", ask: "Gói cước 5G" },
    { label: "📍 Liên hệ cửa hàng", ask: "Địa chỉ cửa hàng" },
  ],
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9*]+/g, " ");

interface Rule {
  keywords: string[];
  reply: BotReply;
}

const RULES: Rule[] = [
  {
    keywords: ["xin chao", "chao", "hello", "hi", "alo"],
    reply: GREETING,
  },
  {
    keywords: ["nam sinh", "ngay sinh", "sinh nam"],
    reply: {
      text:
        "Sim năm sinh là số có đuôi trùng năm sinh của anh/chị (ví dụ ...1990). Em mở mục Sim năm sinh, anh/chị nhập ngày sinh là thấy ngay các số phù hợp nhé.",
      actions: [{ label: "Mở Sim năm sinh", command: { kind: "type", value: "NAM_SINH" } }],
    },
  },
  {
    keywords: ["menh", "phong thuy", "ngu hanh", "hop tuoi"],
    reply: {
      text:
        "Để chọn sim hợp mệnh, anh/chị nhập ngày sinh và giới tính. Hệ thống tính năm âm lịch và mệnh ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ), rồi gợi ý các số hợp mệnh.",
      actions: [{ label: "Mở Sim phong thủy", command: { kind: "type", value: "PHONG_THUY" } }],
    },
  },
  {
    keywords: ["loc phat", "68", "86"],
    reply: {
      text: "Sim lộc phát có đuôi 68 hoặc 86, mang ý nghĩa phát lộc, được nhiều khách kinh doanh lựa chọn.",
      actions: [
        { label: "Xem sim lộc phát", command: { kind: "type", value: "LOC_PHAT" } },
        { label: "Còn thần tài?", ask: "Sim thần tài" },
      ],
    },
  },
  {
    keywords: ["than tai", "39", "79"],
    reply: {
      text: "Sim thần tài có đuôi 39 hoặc 79. Nếu anh/chị thích đuôi 38, 78 thì đó là sim ông địa ạ.",
      actions: [
        { label: "Xem sim thần tài", command: { kind: "type", value: "THAN_TAI" } },
        { label: "Xem sim ông địa", command: { kind: "type", value: "ONG_DIA" } },
      ],
    },
  },
  {
    keywords: ["ong dia", "38", "78"],
    reply: {
      text: "Sim ông địa có đuôi 38 hoặc 78.",
      actions: [{ label: "Xem sim ông địa", command: { kind: "type", value: "ONG_DIA" } }],
    },
  },
  {
    keywords: ["tu quy", "ngu quy", "tam hoa", "vip"],
    reply: {
      text:
        "Dòng số VIP gồm tam hoa (đuôi 3 số giống nhau), tứ quý (4 số) và ngũ quý (5 số). Số lượng có hạn, anh/chị xem nhanh nhé.",
      actions: [
        { label: "Tam hoa", command: { kind: "type", value: "TAM_HOA" } },
        { label: "Tứ quý", command: { kind: "type", value: "TU_QUY" } },
        { label: "Ngũ quý", command: { kind: "type", value: "NGU_QUY" } },
      ],
    },
  },
  {
    keywords: ["so tien", "so lap", "so ganh", "de nho"],
    reply: {
      text:
        "Số dễ nhớ có số tiến (1234), số lặp (6868) và số gánh (6886). Anh/chị chọn kiểu mình thích nhé.",
      actions: [
        { label: "Số tiến", command: { kind: "type", value: "SO_TIEN" } },
        { label: "Số lặp", command: { kind: "type", value: "SO_LAP" } },
        { label: "Số gánh", command: { kind: "type", value: "SO_GANH" } },
      ],
    },
  },
  {
    keywords: ["gia", "re", "tien", "ngan sach", "trieu"],
    reply: {
      text:
        "Anh/chị có thể chọn khoảng giá ở bộ lọc \"Khoảng giá chọn số\" bên trái danh sách. Giá SIM đã gồm phí hòa mạng; gói cước được chọn và thanh toán riêng.",
    },
  },
  {
    keywords: ["goi cuoc", "5g", "data", "goi"],
    reply: {
      text:
        "Hoàng Lâm có các gói cước Viettel 4G/5G kèm SIM. Anh/chị kéo xuống mục \"Gói cước Viettel\" để so sánh dung lượng và giá, sau đó chọn số đi kèm.",
    },
  },
  {
    keywords: ["tim so", "tim kiem", "duoi", "dau so"],
    reply: {
      text:
        "Anh/chị nhập số hoặc mẫu vào ô tìm kiếm: dùng x thay cho 1 chữ số bất kỳ, * cho nhiều chữ số. Ví dụ 098x68 hoặc *1990.",
    },
  },
  {
    keywords: ["mua", "dat", "giao", "ship", "thanh toan"],
    reply: {
      text:
        "Anh/chị bấm \"Chọn mua\" ở số muốn mua, điền thông tin và chọn nhận tại cửa hàng hoặc giao tận nơi. Nhân viên sẽ gọi lại xác nhận trước khi giao ạ.",
    },
  },
  {
    keywords: ["dia chi", "cua hang", "lien he", "hotline", "so dien thoai", "o dau"],
    reply: {
      text:
        "Anh/chị xem địa chỉ và hotline các cửa hàng Hoàng Lâm ở cuối trang. Nếu cần gặp nhân viên tư vấn trực tiếp, anh/chị cứ ghé cửa hàng gần nhất nhé.",
    },
  },
  {
    keywords: ["cam on", "thanks", "ok"],
    reply: { text: "Dạ, cảm ơn anh/chị! Cần thêm gì anh/chị cứ nhắn em nhé 😊" },
  },
];

const FALLBACK: BotReply = {
  text:
    "Dạ em chưa hiểu rõ ý anh/chị. Anh/chị có thể chọn một trong các chủ đề dưới đây, hoặc nhập đuôi số muốn tìm (ví dụ 6868).",
  actions: GREETING.actions,
};

// A number or pattern typed straight in, e.g. "6868", "098x68", "*1990".
const NUMBER_PATTERN = /^[\d\s.xX*]{3,}$/;

export function replyTo(message: string): BotReply {
  const trimmed = message.trim();
  if (NUMBER_PATTERN.test(trimmed) && /\d/.test(trimmed)) {
    const pattern = trimmed.replace(/[\s.]/g, "").toLowerCase();
    return {
      text: `Em tìm các số khớp "${pattern}" trong kho cho anh/chị nhé.`,
      actions: [{ label: `Xem số khớp ${pattern}`, command: { kind: "search", value: pattern } }],
    };
  }

  // Whole words only, so "re" (rẻ) doesn't fire inside other words.
  const text = ` ${normalize(trimmed)} `;
  const rule = RULES.find((item) => item.keywords.some((keyword) => text.includes(` ${keyword} `)));
  return rule?.reply ?? FALLBACK;
}
