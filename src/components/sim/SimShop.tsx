"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ARTICLES,
  BUDGETS,
  ELEMENT_FILTERS,
  ELEMENT_ICONS,
  PLANS,
  PREFIXES,
  SIM_ENTRIES,
  SIM_TYPES,
  STORES,
  formatNumber,
  money,
  type Plan,
  type SimEntry,
} from "./data";
import { useShopUi, type DemoOrder } from "./ShopUiContext";
import { OrdersModal } from "./OrdersModal";

type Modal =
  | { kind: "details"; id: number }
  | { kind: "compare" }
  | { kind: "order"; id: number }
  | { kind: "orderDone"; order: DemoOrder }
  | { kind: "article"; index: number }
  | { kind: "orders" };

const KIOSK_IDLE_MS = 180_000;

// Search accepts digits plus "x"/"*" wildcards, e.g. "098x68".
function matchesPattern(number: string, q: string) {
  if (!q) return true;
  if (/[x*]/.test(q)) return new RegExp("^" + q.replace(/[x*]+/g, "[0-9]*") + "$").test(number);
  return number.includes(q);
}

export function SimShop() {
  const { mode, favorites, toggleFavorite, favoriteOnly, setFavoriteOnly, orders, addOrder, command, notify } =
    useShopUi();

  const [query, setQuery] = useState("");
  const [type, setType] = useState("Tất cả");
  const [budget, setBudget] = useState("all");
  const [prefix, setPrefix] = useState("all");
  const [element, setElement] = useState<string>("all");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("suggest");
  const [selected, setSelected] = useState<number[]>([]);
  const [chosenPlans, setChosenPlans] = useState<Record<number, string>>({});
  const [packageTarget, setPackageTarget] = useState<number | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLElement>(null);
  const elementFilterRef = useRef<HTMLDivElement>(null);

  const planFor = useCallback(
    (entry: SimEntry): Plan => PLANS.find((plan) => plan.id === chosenPlans[entry.id]) ?? PLANS[0],
    [chosenPlans],
  );
  const totalFor = (entry: SimEntry) => entry.price + planFor(entry).price;

  const pattern = query.toLowerCase().replace(/[^0-9x*]/g, "");

  const eligible = useCallback(
    (entry: SimEntry) => {
      const [min, max] = budget.split("-").map(Number);
      return (
        (!year || entry.number.includes(year)) &&
        (element === "all" || entry.element === element) &&
        (!favoriteOnly || favorites.includes(entry.id)) &&
        (type === "Tất cả" || entry.type === type) &&
        (prefix === "all" || entry.number.startsWith(prefix)) &&
        (budget === "all" || (entry.price >= min && entry.price < max))
      );
    },
    [budget, year, element, favoriteOnly, favorites, type, prefix],
  );

  const rows = useMemo(() => {
    const list = SIM_ENTRIES.filter((entry) => eligible(entry) && matchesPattern(entry.number, pattern));
    if (sort !== "suggest") list.sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
    return list;
  }, [eligible, pattern, sort]);

  // Numbers close to the typed pattern (same prefix / suffix) to compare too.
  const references = useMemo(() => {
    if (!/\d/.test(pattern)) return [];
    const wild = /[x*]/.test(pattern);
    const parts = pattern.split(/[x*]+/);
    const head = wild ? parts[0] : pattern.length >= 3 && pattern.startsWith("0") ? pattern.slice(0, 3) : "";
    const tail = wild ? parts[parts.length - 1] : head ? pattern.slice(3) : pattern;
    return SIM_ENTRIES.filter((entry) => eligible(entry) && !matchesPattern(entry.number, pattern))
      .map((entry) => ({
        entry,
        score:
          (head && entry.number.startsWith(head) ? 4 : 0) +
          (tail && entry.number.endsWith(tail) ? 3 : 0) +
          (tail.length >= 2 && entry.number.includes(tail) ? 1 : 0),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.price - b.entry.price)
      .slice(0, 6)
      .map((item) => item.entry);
  }, [eligible, pattern]);

  const resetFilters = useCallback(() => {
    setType("Tất cả");
    setElement("all");
    setFavoriteOnly(false);
    setYear("");
    setQuery("");
    setBudget("all");
    setPrefix("all");
    setSort("suggest");
  }, [setFavoriteOnly]);

  const newCustomer = useCallback(
    (silent = false) => {
      setSelected([]);
      setPackageTarget(null);
      setPendingPlan(null);
      setChosenPlans({});
      setModal(null);
      resetFilters();
      if (!silent) notify("Đã bắt đầu lượt khách mới.");
    },
    [resetFilters, notify],
  );

  // Header / footer commands.
  useEffect(() => {
    if (!command) return;
    /* eslint-disable react-hooks/set-state-in-effect -- applying an external command */
    if (command.kind === "reset") resetFilters();
    if (command.kind === "type") setType(command.value);
    if (command.kind === "favorites") setFavoriteOnly(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (command.kind === "focusElement") {
      elementFilterRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [command, resetFilters, setFavoriteOnly]);

  // Kiosk: back to a fresh screen after 3 minutes without a touch.
  useEffect(() => {
    if (mode !== "kiosk") return;
    let idle = setTimeout(() => newCustomer(true), KIOSK_IDLE_MS);
    const onPointer = () => {
      clearTimeout(idle);
      idle = setTimeout(() => newCustomer(true), KIOSK_IDLE_MS);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => {
      clearTimeout(idle);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [mode, newCustomer]);

  // The dialog follows `modal`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modal && !dialog.open) dialog.showModal();
    if (!modal && dialog.open) dialog.close();
  }, [modal]);

  const toggleSelect = (id: number, checked: boolean) => {
    if (checked && selected.length >= 3) {
      notify("Bạn có thể so sánh tối đa 3 số.");
      return;
    }
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const openDetails = (id: number) => {
    if (pendingPlan) {
      setChosenPlans((prev) => ({ ...prev, [id]: pendingPlan }));
      setPendingPlan(null);
    }
    setModal({ kind: "details", id });
  };

  const choosePackageFor = (id: number) => {
    setPackageTarget(id);
    setModal(null);
    packagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pickPackage = (planId: string) => {
    if (packageTarget === null) {
      setPendingPlan(planId);
      notify("Đã chọn gói. Anh/chị chọn số SIM bên dưới.");
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const id = packageTarget;
    setChosenPlans((prev) => ({ ...prev, [id]: planId }));
    setPackageTarget(null);
    setModal({ kind: "details", id });
  };

  const submitOrder = (event: FormEvent<HTMLFormElement>, entry: SimEntry) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const order: DemoOrder = {
      id: "HL" + Date.now().toString().slice(-8),
      name: data.name,
      phone: data.phone,
      sim: data.sim,
      delivery: data.delivery,
      store: data.store,
      note: data.note ?? "",
      number: entry.number,
      price: totalFor(entry),
      plan: planFor(entry).id,
      date: new Date().toLocaleString("vi-VN"),
    };
    addOrder(order);
    setModal({ kind: "orderDone", order });
  };

  const card = (entry: SimEntry) => {
    const formatted = formatNumber(entry.number);
    const isFavorite = favorites.includes(entry.id);
    return (
      <article key={entry.id} className="card">
        <span className="tag">{entry.type.toUpperCase()}</span>
        <button
          type="button"
          className={`heart ${isFavorite ? "on" : ""}`}
          aria-label="Lưu số yêu thích"
          aria-pressed={isFavorite}
          onClick={() => toggleFavorite(entry.id)}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
        <div className="number">
          {formatted.slice(0, 8)}
          <span>{formatted.slice(8)}</span>
        </div>
        <div className="element">
          {ELEMENT_ICONS[entry.element]} Mệnh: <b>{entry.element}</b>
        </div>
        <div className="price">{money(entry.price)}</div>
        {mode === "staff" && (
          <div className="staffonly">
            Tổng ban đầu: <b>{money(totalFor(entry))}</b>
          </div>
        )}
        <div className="card-bottom">
          <label>
            <input
              type="checkbox"
              checked={selected.includes(entry.id)}
              onChange={(e) => toggleSelect(entry.id, e.target.checked)}
            />{" "}
            So sánh
          </label>
          <button type="button" className="detail" onClick={() => openDetails(entry.id)}>
            {mode === "staff" ? "Xem tư vấn" : "Chọn mua"}
          </button>
        </div>
      </article>
    );
  };

  const pending = pendingPlan ? PLANS.find((plan) => plan.id === pendingPlan) : null;

  return (
    <div className={mode === "customer" ? undefined : mode}>
      <div className="top">
        <div>
          <div className="eyebrow">CHỌN SỐ THEO CÁCH CỦA BẠN</div>
          <h1>Một số đẹp. Một dấu ấn riêng.</h1>
          <p>Tìm đuôi số yêu thích, chọn mức giá phù hợp.</p>
        </div>
        <button type="button" className="reset" onClick={() => newCustomer()}>
          Bắt đầu lượt khách mới
        </button>
      </div>

      <form
        ref={searchRef}
        className="search"
        id="chon-so"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="search"
          inputMode="text"
          aria-label="Tìm số điện thoại"
          placeholder="Nhập số hoặc mẫu, ví dụ: 098x68"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="primary">Tìm số</button>
      </form>

      <div className="quick" role="group" aria-label="Loại số">
        {SIM_TYPES.map((item) => (
          <button
            key={item.name}
            type="button"
            className={item.name === type ? "active" : undefined}
            aria-pressed={item.name === type}
            onClick={() => setType(item.name)}
          >
            <span aria-hidden>{item.icon}</span>
            {item.name}
            <small>{item.sub}</small>
          </button>
        ))}
      </div>

      {mode === "staff" && (
        <div className="staff-banner">
          Chế độ tư vấn minh họa · Xem tổng chi phí, điều kiện gói và so sánh số. Chưa có đăng nhập
          hoặc giữ số trên kho thật.
        </div>
      )}
      {pending && (
        <div className="staff-banner">
          <strong>Gói đã chọn: {pending.name}</strong>
          <p>Chọn số bên dưới để xem giá SIM và tổng thanh toán.</p>
          <button type="button" className="reset" onClick={() => setPendingPlan(null)}>
            Bỏ gói đã chọn
          </button>
        </div>
      )}

      <div className="workspace">
        <aside>
          <h2>Lọc số phù hợp</h2>
          <div>
            <label className="filter" htmlFor="budget">
              Khoảng giá chọn số
            </label>
            <select id="budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
              {BUDGETS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="filter" htmlFor="prefix">
              Đầu số Viettel
            </label>
            <select id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)}>
              <option value="all">Tất cả đầu số</option>
              {PREFIXES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div ref={elementFilterRef}>
            <span className="filter" style={{ display: "block", fontSize: 14, fontWeight: "bold", margin: "20px 0 7px" }}>
              Chọn theo mệnh
            </span>
            <div className="element-buttons">
              {ELEMENT_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={element === item ? "active" : undefined}
                  aria-pressed={element === item}
                  onClick={() => setElement(item)}
                >
                  {item === "all" ? "Tất cả" : item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="filter" htmlFor="year">
              Năm sinh yêu thích
            </label>
            <input
              id="year"
              type="number"
              min={1900}
              max={2099}
              placeholder="Ví dụ: 1985"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 7 }}
            />
          </div>
          <button type="button" className="secondary" onClick={resetFilters}>
            Xóa bộ lọc
          </button>
        </aside>

        <section aria-label="Danh sách số">
          <div className="results-head">
            <div>
              <strong>{rows.length}</strong> <span style={{ color: "var(--muted)" }}>số phù hợp</span>
            </div>
            <select aria-label="Sắp xếp" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="suggest">Gợi ý cho bạn</option>
              <option value="asc">Giá thấp đến cao</option>
              <option value="desc">Giá cao đến thấp</option>
            </select>
          </div>
          <div className="grid" ref={gridRef}>
            {rows.length ? (
              rows.map(card)
            ) : (
              <div className="empty">
                <h2>Chưa có số phù hợp</h2>
                <p>Thử đuôi số ngắn hơn hoặc mở rộng khoảng giá.</p>
                <button type="button" className="secondary" onClick={resetFilters}>
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
          {references.length > 0 && (
            <section className="reference-section" aria-label="Số tham khảo thêm">
              <h2>Số tham khảo thêm</h2>
              <p>
                Các số gần với mẫu {query.trim()} để bạn so sánh thêm. Mệnh và giá là dữ liệu minh
                họa.
              </p>
              <div className="grid">{references.map(card)}</div>
            </section>
          )}
        </section>
      </div>

      <section id="goi-cuoc" ref={packagesRef} className="packages" aria-label="Gói cước tùy chọn">
        <div className="eyebrow">CHỌN THÊM THEO NHU CẦU</div>
        <h2>Gói cước Viettel</h2>
        <p>Giá SIM đã bao gồm phí hòa mạng. Gói cước được chọn và thanh toán riêng.</p>
        <div className="package-grid">
          {PLANS.slice(1).map((plan) => (
            <article key={plan.id} className="package-card">
              <span className="tag">{plan.tag ?? "5G · DATA"}</span>
              <h3>{plan.id.toUpperCase()}</h3>
              <div className="price">
                {money(plan.price)}
                <small>/ {plan.term}</small>
              </div>
              <p>{plan.info}</p>
              <button type="button" className="primary" onClick={() => pickPackage(plan.id)}>
                {packageTarget === null
                  ? "Chọn số với gói này"
                  : "Chọn cho " + formatNumber(SIM_ENTRIES[packageTarget].number)}
              </button>
            </article>
          ))}
        </div>
        <p className="note">
          Các gói 360 ngày theo bảng gói cước được cung cấp. Chi tiết ưu đãi cuộc gọi nội mạng và ưu
          đãi khác cần nhân viên xác nhận trước khi đăng ký. Tiền gói thanh toán riêng, không cộng lại
          phí hòa mạng.
        </p>
      </section>

      <section id="tin-tuc" className="info-section" aria-labelledby="tin-tuc-title">
        <div className="eyebrow">CẨM NANG CHỌN SIM</div>
        <h2 id="tin-tuc-title">Chọn số dễ nhớ, dùng lâu dài</h2>
        <div className="info-grid">
          {ARTICLES.map((article, index) => (
            <article key={article.title}>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <button type="button" className="reset" onClick={() => setModal({ kind: "article", index })}>
                Đọc tiếp
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="footerbar">
        <div>
          <strong>{selected.length ? `Đã chọn ${selected.length}/3 số` : "Chưa chọn số để so sánh"}</strong>
          <small>
            {selected.length
              ? selected.map((id) => formatNumber(SIM_ENTRIES[id].number)).join(" · ")
              : "Chọn tối đa 3 số để xem cùng lúc"}
          </small>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setFavoriteOnly((prev) => !prev);
            searchRef.current?.scrollIntoView();
          }}
        >
          {favoriteOnly ? "♥ Tất cả số" : "♡ Yêu thích"}
        </button>
        <button type="button" className="secondary" onClick={() => setModal({ kind: "orders" })}>
          Đơn demo
        </button>
        <button
          type="button"
          className="primary"
          disabled={selected.length < 2}
          onClick={() => setModal({ kind: "compare" })}
        >
          So sánh số
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="sd-dialog"
        onClose={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setModal(null);
        }}
      >
        <button type="button" className="close" aria-label="Đóng" onClick={() => setModal(null)}>
          ×
        </button>
        {modal?.kind === "details" && (() => {
          const entry = SIM_ENTRIES[modal.id];
          const plan = planFor(entry);
          return (
            <>
              <div className="eyebrow">{entry.type} · Dữ liệu minh họa</div>
              <div className="number">{formatNumber(entry.number)}</div>
              <div className="element">
                {ELEMENT_ICONS[entry.element]} Mệnh: <b>{entry.element}</b>
              </div>
              <p className="note">
                Mệnh đang là dữ liệu minh họa từng số, cần thay bằng mệnh đã xác nhận trước khi bán.
              </p>
              <dl>
                <div>
                  <dt>
                    Giá SIM <small>(chưa bao gồm gói cước)</small>
                  </dt>
                  <dd>{money(entry.price)}</dd>
                </div>
                <div>
                  <dt>Phí hòa mạng</dt>
                  <dd>Đã bao gồm trong giá SIM</dd>
                </div>
              </dl>
              <div className="plan-summary">
                <strong>Gói cước chọn riêng</strong>
                <p>{plan.id === "none" ? "Chưa chọn gói cước" : plan.name}</p>
                <button type="button" className="secondary" onClick={() => choosePackageFor(entry.id)}>
                  {plan.id === "none" ? "Xem và chọn gói cước" : "Đổi gói cước"}
                </button>
                {plan.id !== "none" && (
                  <button
                    type="button"
                    className="reset"
                    onClick={() =>
                      setChosenPlans((prev) => {
                        const next = { ...prev };
                        delete next[entry.id];
                        return next;
                      })
                    }
                  >
                    Bỏ gói
                  </button>
                )}
              </div>
              <dl>
                <div>
                  <dt>Tiền gói đã chọn</dt>
                  <dd>{money(plan.price)}</dd>
                </div>
                <div>
                  <dt>Tổng thanh toán ban đầu</dt>
                  <dd style={{ color: "var(--red)" }}>{money(totalFor(entry))}</dd>
                </div>
              </dl>
              <p className="note">
                Tổng = giá SIM (đã gồm phí hòa mạng) + tiền gói đã chọn. Gói cước Viettel theo chính
                sách được cung cấp; nhân viên xác nhận điều kiện áp dụng. Đây là bản mẫu, chưa thể
                đăng ký hoặc giữ số.
              </p>
              <button type="button" className="primary" onClick={() => setModal({ kind: "order", id: entry.id })}>
                Tiếp tục đặt mua
              </button>
            </>
          );
        })()}

        {modal?.kind === "compare" && (
          <>
            <h2>So sánh số đã chọn</h2>
            <div className="compare-grid">
              {selected.map((id) => {
                const entry = SIM_ENTRIES[id];
                const plan = planFor(entry);
                return (
                  <div key={id}>
                    <span className="tag">{entry.type}</span>
                    <p>
                      Mệnh: <b>{entry.element}</b>
                    </p>
                    <h3>{formatNumber(entry.number)}</h3>
                    <p>
                      Giá SIM (chưa gồm gói)
                      <br />
                      <b>{money(entry.price)}</b>
                    </p>
                    <p>
                      Phí hòa mạng
                      <br />
                      <b>Đã bao gồm trong giá SIM</b>
                    </p>
                    <p>
                      Gói đã chọn
                      <br />
                      <b>{plan.id === "none" ? "Chưa chọn" : money(plan.price)}</b>
                    </p>
                    <p>
                      Tổng ban đầu
                      <br />
                      <b style={{ color: "var(--red)" }}>{money(totalFor(entry))}</b>
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="note">Giá và điều kiện trong bản mẫu chỉ để minh họa cách tư vấn.</p>
          </>
        )}

        {modal?.kind === "order" && (() => {
          const entry = SIM_ENTRIES[modal.id];
          return (
            <>
              <h2>Đặt mua SIM</h2>
              <div className="number">{formatNumber(entry.number)}</div>
              <p>
                Giá SIM: <b>{money(entry.price)}</b> · Gói: <b>{planFor(entry).id}</b>
              </p>
              <p className="note">
                Tổng dự kiến: <b>{money(totalFor(entry))}</b>. Đơn thử chỉ lưu trên thiết bị này, chưa
                gửi tới cửa hàng.
              </p>
              <form onSubmit={(e) => submitOrder(e, entry)}>
                <label className="formfield">
                  Họ tên
                  <input name="name" required maxLength={80} autoComplete="name" />
                </label>
                <label className="formfield">
                  Số điện thoại liên hệ
                  <input
                    name="phone"
                    required
                    pattern="0[0-9]{9}"
                    inputMode="tel"
                    title="Nhập số điện thoại gồm 10 chữ số, bắt đầu bằng 0"
                    autoComplete="tel"
                  />
                </label>
                <label className="formfield">
                  Hình thức SIM
                  <select name="sim">
                    <option>SIM vật lý</option>
                    <option>eSIM</option>
                  </select>
                </label>
                <label className="formfield">
                  Nhận SIM
                  <select name="delivery">
                    <option>Nhận tại cửa hàng</option>
                    <option>Giao tận nơi</option>
                  </select>
                </label>
                <label className="formfield">
                  Cửa hàng
                  <select name="store">
                    {STORES.map((store) => (
                      <option key={store}>{store}</option>
                    ))}
                  </select>
                </label>
                <label className="formfield">
                  Địa chỉ / Ghi chú
                  <textarea name="note" maxLength={300} />
                </label>
                <button className="primary">Tạo đơn demo</button>
              </form>
            </>
          );
        })()}

        {modal?.kind === "orderDone" && (
          <>
            <h2>Đã tạo đơn demo</h2>
            <p>
              Mã đơn: <b>{modal.order.id}</b>
            </p>
            <div className="number">{formatNumber(modal.order.number)}</div>
            <p>
              Tổng dự kiến: <b>{money(modal.order.price)}</b>
            </p>
            <p className="note">
              Anh/chị có thể xem lại trong “Đơn demo”. Đơn chưa được gửi và số chưa được giữ trên kho
              thật.
            </p>
            <button type="button" className="primary" onClick={() => setModal({ kind: "orders" })}>
              Xem đơn demo
            </button>
          </>
        )}

        {modal?.kind === "orders" && <OrdersModal orders={orders} />}

        {modal?.kind === "article" && (
          <>
            <h2>{ARTICLES[modal.index].detailTitle}</h2>
            <p>{ARTICLES[modal.index].detail}</p>
          </>
        )}
      </dialog>
    </div>
  );
}
