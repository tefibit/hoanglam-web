"use client";

import { formatNumber, money } from "./data";
import type { DemoOrder } from "./ShopUiContext";

// "Đơn demo của bạn" — orders saved in this browser only.
export function OrdersModal({ orders }: { orders: DemoOrder[] }) {
  return (
    <>
      <h2>Đơn demo của bạn</h2>
      {orders.length ? (
        orders.map((order) => (
          <div key={order.id} className="order-list">
            <strong>
              {order.id} · {formatNumber(order.number)}
            </strong>
            <p>
              {order.name} · {order.phone}
            </p>
            <p>
              {money(order.price)} · {order.sim} · {order.store}
            </p>
            <p>{order.date} · Đơn thử</p>
          </div>
        ))
      ) : (
        <p>Chưa có đơn demo. Chọn một số để thử đặt mua.</p>
      )}
      <p className="note">Các đơn chỉ lưu trong trình duyệt hiện tại.</p>
    </>
  );
}
