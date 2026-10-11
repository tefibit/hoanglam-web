"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ShopMode = "customer" | "kiosk" | "staff";

export interface DemoOrder {
  id: string;
  name: string;
  phone: string;
  sim: string;
  delivery: string;
  store: string;
  note: string;
  number: string;
  price: number;
  plan: string;
  date: string;
}

// Commands sent from the header / footer to the SIM list on the home page
// (e.g. "SIM năm sinh" in the menu). `nonce` makes repeated clicks count.
export type ShopCommand =
  | { kind: "reset"; nonce: number }
  // value: a sim_types code, e.g. "NAM_SINH".
  | { kind: "type"; value: string; nonce: number }
  | { kind: "focusElement"; nonce: number }
  | { kind: "favorites"; nonce: number };

interface ShopUi {
  mode: ShopMode;
  setMode: (mode: ShopMode) => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  favoriteOnly: boolean;
  setFavoriteOnly: (value: boolean | ((prev: boolean) => boolean)) => void;
  orders: DemoOrder[];
  addOrder: (order: DemoOrder) => void;
  command: ShopCommand | null;
  sendCommand: (command: DistributiveOmit<ShopCommand, "nonce">) => void;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
  notify: (text: string) => void;
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

const ShopUiContext = createContext<ShopUi | null>(null);

// v2: ids are real inventory item ids (v1 held demo-list indexes).
const FAVORITES_KEY = "sim-favorites-v2";
const ORDERS_KEY = "sim-orders";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / storage blocked — favourites just won't persist.
  }
}

export function ShopUiProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ShopMode>("customer");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [command, setCommand] = useState<ShopCommand | null>(null);
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Saved in the browser only (as in the demo) — read after mount so the
  // server-rendered HTML matches the first client render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage
    setFavorites(readStorage<number[]>(FAVORITES_KEY, []));
    setOrders(readStorage<DemoOrder[]>(ORDERS_KEY, []));
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeStorage(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const addOrder = useCallback((order: DemoOrder) => {
    setOrders((prev) => {
      const next = [order, ...prev];
      writeStorage(ORDERS_KEY, next);
      return next;
    });
  }, []);

  const sendCommand = useCallback((next: DistributiveOmit<ShopCommand, "nonce">) => {
    setCommand({ ...next, nonce: Date.now() } as ShopCommand);
  }, []);

  const openModal = useCallback((content: ReactNode) => {
    setModalContent(content);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const notify = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const value = useMemo<ShopUi>(
    () => ({
      mode,
      setMode,
      favorites,
      toggleFavorite,
      favoriteOnly,
      setFavoriteOnly,
      orders,
      addOrder,
      command,
      sendCommand,
      openModal,
      closeModal,
      notify,
    }),
    [mode, favorites, toggleFavorite, favoriteOnly, orders, addOrder, command, sendCommand, openModal, closeModal, notify],
  );

  return (
    <ShopUiContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        className="sd-dialog"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        onClose={() => setModalContent(null)}
      >
        <button type="button" className="close" aria-label="Đóng" onClick={closeModal}>
          ×
        </button>
        {modalContent}
      </dialog>
      <div className="toast" role="status" hidden={!toast}>
        {toast}
      </div>
    </ShopUiContext.Provider>
  );
}

export function useShopUi() {
  const context = useContext(ShopUiContext);
  if (!context) throw new Error("useShopUi must be used inside <ShopUiProvider>");
  return context;
}
