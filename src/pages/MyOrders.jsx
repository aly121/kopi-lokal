
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  PackageCheck,
  ArrowRight,
  UserRound,
  Coffee,
} from "lucide-react";
import { formatIDR } from "../utils/currency";

const paymentLabels = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  expired: "Expired",
};

const orderLabels = {
  awaiting_payment: "Awaiting payment",
  new: "Order received",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MyOrders() {
  const [orderIds] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("kopi-local-order-ids") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      const results = await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            const response = await fetch(
              `/api/orders/${encodeURIComponent(orderId)}`
            );

            if (!response.ok) return null;

            const data = await response.json();

            return { ...data, orderId };
          } catch {
            return null;
          }
        })
      );

      if (active) {
        setOrders(results.filter(Boolean));
        setLoading(false);
      }
    };

    loadOrders();

    const interval = window.setInterval(loadOrders, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderIds]);

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p className="eyebrow">YOUR KOPI LOKAL PURCHASES</p>
          <h1>MY <span>ORDERS.</span></h1>
          <p>Loading your orders...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section my-orders-page">
      <div className="container">
        <div className="my-orders-heading">
          <div>
            <p className="eyebrow">YOUR KOPI LOKAL PURCHASES</p>
            <h1>MY <span>ORDERS.</span></h1>
            <p>
              Follow your payments, queue numbers, and order progress.
            </p>
          </div>

          <Link to="/shop" className="button button-secondary">
            Shop coffee <ArrowRight size={16} />
          </Link>
        </div>

        {!orders.length ? (
          <div className="admin-empty">
            <ClipboardList size={32} />
            <h2>No orders found yet.</h2>
            <p>Your orders will appear here after you place an order.</p>
            <Link to="/shop" className="button button-primary">
              Explore coffee <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="my-orders-list">
            {orders.map((order) => {
              const isPaid = order.paymentStatus === "paid";
              const customerName =
                order.customerName ||
                order.customer?.name ||
                "Customer";

              return (
                <article
                  className="my-order-card"
                  key={order.orderId}
                >
                  <div className="my-order-top">
                    <div>
                      <p className="eyebrow">ORDER REFERENCE</p>
                      <h2>{order.orderId}</h2>
                      <p className="my-order-date">
                        <Clock3 size={14} />
                        {formatDate(order.createdAt || order.updatedAt)}
                      </p>
                    </div>

                    <span
                      className={`my-order-payment ${
                        isPaid ? "is-paid" : ""
                      }`}
                    >
                      {isPaid && <CheckCircle2 size={14} />}
                      {paymentLabels[order.paymentStatus] ||
                        order.paymentStatus ||
                        "Unknown"}
                    </span>
                  </div>

                  <div className="my-order-details">
                    <div className="my-order-customer">
                      <UserRound size={18} />
                      <div>
                        <span>Customer</span>
                        <strong>{customerName}</strong>
                      </div>
                    </div>

                    <div className="my-order-total">
                      <span>Order total</span>
                      <strong>{formatIDR(order.total)}</strong>
                    </div>
                  </div>

                  <div className="my-order-progress">
                    <div className="my-order-queue">
                      <span>QUEUE NUMBER</span>
                      <strong>
                        {order.queueNumber != null
                          ? String(order.queueNumber).padStart(2, "0")
                          : isPaid
                            ? "Assigning..."
                            : "—"}
                      </strong>
                    </div>

                    <div className="my-order-status">
                      <PackageCheck size={18} />
                      <div>
                        <span>Order status</span>
                        <strong>
                          {orderLabels[order.orderStatus] ||
                            order.orderStatus ||
                            "Unknown"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {isPaid && (
                    <div className="my-order-confirmation">
                      <CheckCircle2 size={16} />
                      Payment confirmed
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
