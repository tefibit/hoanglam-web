"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ARTICLES,
  BUDGETS,
  ELEMENTS,
  PLANS,
  PREFIXES,
  SIM_TYPE_ICONS,
  STORES,
  formatNumber,
  money,
  priceText,
  type Plan,
} from "./data";
import { useShopUi, type DemoOrder } from "./ShopUiContext";
import { OrdersModal } from "./OrdersModal";
import { BirthSearchPanel, type BirthInfo } from "./BirthSearchPanel";
import {
  useFeaturedSims,
  useMenh,
  useSimSearch,
  useSimStatus,
  useSimilarSims,
  useWebSimTypes,
  type SimFilters,
  type SimSort,
  type WebSim,
} from "@/lib/api/sims";

type Modal =
  | { kind: "details"; sim: WebSim }
  | { kind: "compare" }
  | { kind: "order"; sim: WebSim }
  | { kind: "orderDone"; order: DemoOrder }
  | { kind: "article"; index: number }
  | { kind: "orders" };

const KIOSK_IDLE_MS = 180_000;
const DEBOUNCE_MS = 350;

const isElementCode = (code: string) => code.startsWith("MENH_");

// The badge on a card: "Đề xuất", else its first (non-mệnh) loại sim.
function cardTag(sim: WebSim) {
  if (sim.featured) return "★ Đề xuất";
  return sim.simTypes.find((type) => !isElementCode(type.code))?.name ?? "Sim số";
}

function elementOf(sim: WebSim) {
  return ELEMENTS.find((element) => sim.simTypes.some((type) => type.code === element.code));
}

function useDebounced<T>(value: T, delay = DEBOUNCE_MS) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SimShop() {
  const { mode, favorites, toggleFavorite, favoriteOnly, setFavoriteOnly, orders, addOrder, command, notify } =
    useShopUi();

  const [query, setQuery] = useState("");
  // Loại sim / mệnh are sim_types codes ("all" = no filter).
  const [type, setType] = useState("all");
  const [budget, setBudget] = useState("all");
  const [prefix, setPrefix] = useState("all");
  const [element, setElement] = useState<string>("all");
  const [year, setYear] = useState("");
  // Ngày sinh + giới tính entered for "năm sinh" / "phong thủy".
  const [birth, setBirth] = useState<BirthInfo | null>(null);
  const [sort, setSort] = useState<SimSort>("suggested");
  const [selected, setSelected] = useState<WebSim[]>([]);
  const [chosenPlans, setChosenPlans] = useState<Record<number, string>>({});
  const [packageTarget, setPackageTarget] = useState<WebSim | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLElement>(null);
  const elementFilterRef = useRef<HTMLDivElement>(null);

  const planFor = useCallback(
    (sim: WebSim): Plan => PLANS.find((plan) => plan.id === chosenPlans[sim.id]) ?? PLANS[0],
    [chosenPlans],
  );
  const totalFor = (sim: WebSim) => (sim.price ?? 0) + planFor(sim).price;

  const pattern = query.toLowerCase().replace(/[^0-9x*]/g, "");
  const debouncedPattern = useDebounced(pattern);
  const debouncedYear = useDebounced(year.replace(/\D/g, ""));

  const { data: simTypes } = useWebSimTypes();
  const quickTypes = (simTypes ?? []).filter((item) => !isElementCode(item.code));
  const elementTypes = ELEMENTS.filter((item) => simTypes?.some((simType) => simType.code === item.code));
  const slugOf = useCallback(
    (code: string) => simTypes?.find((simType) => simType.code === code)?.slug,
    [simTypes],
  );

  const birthMode = type === "NAM_SINH" || type === "PHONG_THUY" ? type : null;
  const activeBirth = birthMode ? birth : null;
  const menh = useMenh(
    birthMode === "PHONG_THUY" ? activeBirth?.date : undefined,
    birthMode === "PHONG_THUY" ? activeBirth?.gender : undefined,
  );

  const filters = useMemo<SimFilters>(() => {
    const [minPrice, maxPrice] = budget === "all" ? [] : budget.split("-").map(Number);
    const typeSlugs = [type, element]
      .filter((code) => code !== "all")
      .map((code) => slugOf(code))
      .filter((slug): slug is string => Boolean(slug));
    let types = typeSlugs;
    let suffix = "";
    if (activeBirth && type === "NAM_SINH") {
      // Numbers ending with the birth year, tagged or not.
      types = types.filter((slug) => slug !== slugOf("NAM_SINH"));
      suffix = activeBirth.date.slice(0, 4);
    }
    if (activeBirth && type === "PHONG_THUY" && menh.data?.sim_type) {
      // The visitor's mệnh replaces the generic "phong thủy" tag.
      types = [...types.filter((slug) => slug !== slugOf("PHONG_THUY")), menh.data.sim_type.slug];
    }
    return {
      types: [...new Set(types)],
      search: debouncedPattern,
      contains: debouncedYear,
      suffix,
      prefix: prefix === "all" ? "" : prefix,
      minPrice,
      maxPrice,
      ids: favoriteOnly ? favorites : undefined,
    };
  }, [budget, type, element, slugOf, activeBirth, menh.data, debouncedPattern, debouncedYear, prefix, favoriteOnly, favorites]);

  // "Yêu thích" with nothing saved → nothing to ask the API for.
  const noFavorites = favoriteOnly && favorites.length === 0;
  const simSearch = useSimSearch(filters, sort, !noFavorites);
  const rows = noFavorites ? [] : (simSearch.data?.pages.flatMap((page) => page.data) ?? []);
  const total = noFavorites ? 0 : (simSearch.data?.pages[0]?.pagination.total ?? 0);

  const similar = useSimilarSims(filters);
  const references = favoriteOnly ? [] : (similar.data ?? []);

  const hasFilters =
    type !== "all" ||
    element !== "all" ||
    budget !== "all" ||
    prefix !== "all" ||
    Boolean(year) ||
    Boolean(pattern) ||
    favoriteOnly;
  const featured = useFeaturedSims();
  const featuredSims = hasFilters ? [] : (featured.data ?? []);

  const resetFilters = useCallback(() => {
    setType("all");
    setElement("all");
    setBirth(null);
    setFavoriteOnly(false);
    setYear("");
    setQuery("");
    setBudget("all");
    setPrefix("all");
    setSort("suggested");
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

  const toggleSelect = (sim: WebSim, checked: boolean) => {
    if (checked && selected.length >= 3) {
      notify("Bạn có thể so sánh tối đa 3 số.");
      return;
    }
    setSelected((prev) => (checked ? [...prev, sim] : prev.filter((item) => item.id !== sim.id)));
  };

  const openDetails = (sim: WebSim) => {
    if (pendingPlan) {
      setChosenPlans((prev) => ({ ...prev, [sim.id]: pendingPlan }));
      setPendingPlan(null);
    }
    setModal({ kind: "details", sim });
  };

  const choosePackageFor = (sim: WebSim) => {
    setPackageTarget(sim);
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
    const sim = packageTarget;
    setChosenPlans((prev) => ({ ...prev, [sim.id]: planId }));
    setPackageTarget(null);
    setModal({ kind: "details", sim });
  };

  const submitOrder = (event: FormEvent<HTMLFormElement>, entry: WebSim) => {
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
      number: entry.phoneNumber,
      price: totalFor(entry),
      plan: planFor(entry).id,
      date: new Date().toLocaleString("vi-VN"),
    };
    addOrder(order);
    setModal({ kind: "orderDone", order });
  };

  const card = (sim: WebSim) => {
    const formatted = formatNumber(sim.phoneNumber);
    const isFavorite = favorites.includes(sim.id);
    const element = elementOf(sim);
    return (
      <article key={sim.id} className="card">
        <span className="tag">{cardTag(sim).toUpperCase()}</span>
        <button
          type="button"
          className={`heart ${isFavorite ? "on" : ""}`}
          aria-label="Lưu số yêu thích"
          aria-pressed={isFavorite}
          onClick={() => toggleFavorite(sim.id)}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
        <div className="number">
          {formatted.slice(0, 8)}
          <span>{formatted.slice(8)}</span>
        </div>
        <div className="element">
          {element ? (
            <>
              {element.icon} Mệnh: <b>{element.label}</b>
            </>
          ) : (
            <>📍 {sim.store.name}</>
          )}
        </div>
        <div className="price">{priceText(sim.price)}</div>
        {mode === "staff" && (
          <div className="staffonly">
            Tổng ban đầu: <b>{money(totalFor(sim))}</b>
          </div>
        )}
        <div className="card-bottom">
          <label>
            <input
              type="checkbox"
              checked={selected.some((item) => item.id === sim.id)}
              onChange={(e) => toggleSelect(sim, e.target.checked)}
            />{" "}
            So sánh
          </label>
          <button type="button" className="detail" onClick={() => openDetails(sim)}>
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
        <button
          type="button"
          className={type === "all" ? "active" : undefined}
          aria-pressed={type === "all"}
          onClick={() => setType("all")}
        >
          <span aria-hidden>▦</span>
          Tất cả
          <small>Tổng hợp số đẹp</small>
        </button>
        {quickTypes.map((item) => (
          <button
            key={item.code}
            type="button"
            className={item.code === type ? "active" : undefined}
            aria-pressed={item.code === type}
            title={item.description ?? undefined}
            onClick={() => setType(item.code)}
          >
            <span aria-hidden>{SIM_TYPE_ICONS[item.code] ?? "✦"}</span>
            {item.name.replace(/^Sim\s+/i, "")}
            <small>{item.count.toLocaleString("vi-VN")} số</small>
          </button>
        ))}
      </div>

      {mode === "staff" && (
        <div className="staff-banner">
          Chế độ tư vấn · Xem tổng chi phí, điều kiện gói và so sánh số. Chưa có đăng nhập nhân viên
          hoặc giữ số.
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
            {elementTypes.length > 0 ? (
              <div className="element-buttons">
                {[{ code: "all", label: "Tất cả" }, ...elementTypes].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={element === item.code ? "active" : undefined}
                    aria-pressed={element === item.code}
                    onClick={() => setElement(item.code)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="note">Đang cập nhật sim theo mệnh.</p>
            )}
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
          {featuredSims.length > 0 && (
            <section className="featured-section" aria-label="Sim đề xuất">
              <h2>Sim đề xuất</h2>
              <p>Những số cửa hàng chọn riêng cho bạn.</p>
              <div className="grid">{featuredSims.map(card)}</div>
            </section>
          )}
          {birthMode && (
            <BirthSearchPanel
              key={birthMode}
              mode={birthMode}
              value={birth}
              onChange={setBirth}
              menh={menh.data}
              menhLoading={menh.isFetching}
              menhError={menh.isError ? "Không tính được mệnh, vui lòng thử lại." : undefined}
            />
          )}
          <div className="results-head">
            <div>
              <strong>{total.toLocaleString("vi-VN")}</strong>{" "}
              <span style={{ color: "var(--muted)" }}>số phù hợp</span>
            </div>
            <select aria-label="Sắp xếp" value={sort} onChange={(e) => setSort(e.target.value as SimSort)}>
              <option value="suggested">Gợi ý cho bạn</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
            </select>
          </div>
          <div className={`grid ${simSearch.isPlaceholderData ? "is-stale" : ""}`} ref={gridRef} aria-busy={simSearch.isFetching}>
            {simSearch.isPending && !noFavorites ? (
              <div className="empty">
                <p>Đang tải danh sách số…</p>
              </div>
            ) : simSearch.isError ? (
              <div className="empty">
                <h2>Không tải được danh sách số</h2>
                <p>{simSearch.error.message}</p>
                <button type="button" className="secondary" onClick={() => simSearch.refetch()}>
                  Thử lại
                </button>
              </div>
            ) : rows.length ? (
              rows.map(card)
            ) : (
              <div className="empty">
                <h2>{noFavorites ? "Chưa có số yêu thích" : "Chưa có số phù hợp"}</h2>
                <p>
                  {noFavorites
                    ? "Bấm ♡ trên một số để lưu lại xem sau."
                    : "Thử đuôi số ngắn hơn hoặc mở rộng khoảng giá."}
                </p>
                <button type="button" className="secondary" onClick={resetFilters}>
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
          {simSearch.hasNextPage && (
            <div className="load-more">
              <button
                type="button"
                className="secondary"
                disabled={simSearch.isFetchingNextPage}
                onClick={() => simSearch.fetchNextPage()}
              >
                {simSearch.isFetchingNextPage ? "Đang tải…" : `Xem thêm số (còn ${(total - rows.length).toLocaleString("vi-VN")})`}
              </button>
            </div>
          )}
          {references.length > 0 && (
            <section className="reference-section" aria-label="Số tham khảo thêm">
              <h2>Số tham khảo thêm</h2>
              <p>Các số có đầu số hoặc đuôi số gần với mẫu {query.trim()} để bạn so sánh thêm.</p>
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
                  : "Chọn cho " + formatNumber(packageTarget.phoneNumber)}
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
              ? selected.map((sim) => formatNumber(sim.phoneNumber)).join(" · ")
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
        {modal?.kind === "details" && (
          <SimDetails
            key={modal.sim.id}
            sim={modal.sim}
            plan={planFor(modal.sim)}
            onChoosePackage={choosePackageFor}
            onRemovePlan={(sim) =>
              setChosenPlans((prev) => {
                const next = { ...prev };
                delete next[sim.id];
                return next;
              })
            }
            onOrder={(sim) => setModal({ kind: "order", sim })}
          />
        )}

        {modal?.kind === "compare" && (
          <>
            <h2>So sánh số đã chọn</h2>
            <div className="compare-grid">
              {selected.map((entry) => {
                const plan = planFor(entry);
                return (
                  <div key={entry.id}>
                    <span className="tag">{cardTag(entry)}</span>
                    <p>
                      Loại: <b>{entry.simTypes.map((simType) => simType.name).join(", ") || "—"}</b>
                    </p>
                    <h3>{formatNumber(entry.phoneNumber)}</h3>
                    <p>
                      Giá SIM (chưa gồm gói)
                      <br />
                      <b>{priceText(entry.price)}</b>
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
            <p className="note">Gói cước và điều kiện áp dụng cần nhân viên xác nhận trước khi đăng ký.</p>
          </>
        )}

        {modal?.kind === "order" && (() => {
          const entry = modal.sim;
          return (
            <>
              <h2>Đặt mua SIM</h2>
              <div className="number">{formatNumber(entry.phoneNumber)}</div>
              <p>
                Giá SIM: <b>{priceText(entry.price)}</b> · Gói: <b>{planFor(entry).id}</b>
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

interface SimDetailsProps {
  sim: WebSim;
  plan: Plan;
  onChoosePackage: (sim: WebSim) => void;
  onRemovePlan: (sim: WebSim) => void;
  onOrder: (sim: WebSim) => void;
}

// Number details. Status and price are re-checked with the server when
// opened — the list may be minutes old and the number already sold.
function SimDetails({ sim: listed, plan, onChoosePackage, onRemovePlan, onOrder }: SimDetailsProps) {
  const status = useSimStatus(listed.id);
  const sim = status.data ?? listed;
  const soldOut = status.isError;
  const priceChanged = status.data && status.data.price !== listed.price;
  const element = elementOf(sim);
  const total = (sim.price ?? 0) + plan.price;

  return (
    <>
      <div className="eyebrow">
        {sim.simTypes.map((type) => type.name).join(" · ") || "Sim số"}
      </div>
      <div className="number">{formatNumber(sim.phoneNumber)}</div>
      {element && (
        <div className="element">
          {element.icon} Mệnh: <b>{element.label}</b>
        </div>
      )}
      <p className="note">
        {status.isPending && "Đang kiểm tra tình trạng số…"}
        {soldOut && <b style={{ color: "var(--red)" }}>Số này vừa được bán hoặc không còn bán trên website.</b>}
        {status.data && <>✓ Còn hàng tại {sim.store.name}.</>}
        {priceChanged && " Giá đã được cập nhật."}
      </p>
      <dl>
        <div>
          <dt>
            Giá SIM <small>(chưa bao gồm gói cước)</small>
          </dt>
          <dd>{priceText(sim.price)}</dd>
        </div>
        <div>
          <dt>Phí hòa mạng</dt>
          <dd>Đã bao gồm trong giá SIM</dd>
        </div>
      </dl>
      <div className="plan-summary">
        <strong>Gói cước chọn riêng</strong>
        <p>{plan.id === "none" ? "Chưa chọn gói cước" : plan.name}</p>
        <button type="button" className="secondary" onClick={() => onChoosePackage(sim)}>
          {plan.id === "none" ? "Xem và chọn gói cước" : "Đổi gói cước"}
        </button>
        {plan.id !== "none" && (
          <button type="button" className="reset" onClick={() => onRemovePlan(sim)}>
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
          <dd style={{ color: "var(--red)" }}>{money(total)}</dd>
        </div>
      </dl>
      <p className="note">
        Tổng = giá SIM (đã gồm phí hòa mạng) + tiền gói đã chọn. Gói cước Viettel theo chính sách được
        cung cấp; nhân viên xác nhận điều kiện áp dụng. Chưa thể giữ số trực tuyến.
      </p>
      <button type="button" className="primary" disabled={!status.data} onClick={() => onOrder(sim)}>
        {soldOut ? "Số không còn bán" : "Tiếp tục đặt mua"}
      </button>
    </>
  );
}
