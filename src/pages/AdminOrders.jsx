import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck, TrendingUp, ShoppingBag, Clock3, Banknote, MessageCircle, CheckCircle2, XCircle, History, Timer } from "lucide-react";
import { WHATSAPP_NUMBER } from "../config";
import { formatIDR } from "../utils/currency";

const orderStatuses = ["new", "preparing", "ready", "completed", "cancelled"];
const paymentCategory = (status) => status === "paid" ? "success" : ["failed", "expired", "cancelled"].includes(status) ? "cancelled" : "process";
const paymentLabels = { success: "Berhasil", cancelled: "Dibatalkan", process: "Proses" };
const orderLabels = { awaiting_payment: "Menunggu pembayaran", new: "Pesanan diterima", preparing: "Sedang dibuat", ready: "Siap diambil", completed: "Sudah diambil", cancelled: "Dibatalkan" };
const paymentStatusLabels = { paid: "Berhasil", pending: "Proses", failed: "Dibatalkan", expired: "Dibatalkan", cancelled: "Dibatalkan" };
const dateTime = (value) => value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Belum tersedia";

export default function AdminOrders() {
  const [token, setToken] = useState(() => sessionStorage.getItem("kopi-admin-token") || "");
  const [draft, setDraft] = useState(token);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sales, setSales] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedHistory, setExpandedHistory] = useState({});

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/admin/orders", { headers: { "x-admin-token": token } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tidak dapat memuat pesanan");
      setOrders(data); setError(""); setLastUpdated(new Date());
      const salesResponse = await fetch("/api/admin/sales", { headers: { "x-admin-token": token } });
      const salesData = await salesResponse.json();
      if (salesResponse.ok) setSales(salesData);
    } catch (err) { setError(err.message); }
  }, [token]);
  useEffect(() => { if (!token) return undefined; load(); const timer = window.setInterval(load, 5000); return () => window.clearInterval(timer); }, [token, load]);
  const login = (event) => { event.preventDefault(); sessionStorage.setItem("kopi-admin-token", draft); setToken(draft); };
  const updateStatus = async (orderId, orderStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ orderStatus }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Tidak dapat mengubah status"); await load();
    } catch (err) { setError(err.message); }
  };
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesPayment = paymentFilter === "all" || paymentCategory(order.paymentStatus) === paymentFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [order.orderId, order.customer?.name, order.customer?.phone].some((value) => String(value || "").toLowerCase().includes(q));
    return matchesPayment && matchesSearch;
  }), [orders, paymentFilter, search]);

  if (!token) return <section className="section admin-page"><div className="container admin-login"><ShieldCheck size={42}/><p className="eyebrow">KHUSUS STAF</p><h1>SALES <span>& PESANAN.</span></h1><form onSubmit={login} className="checkout-form"><label className="form-field">Token akses admin<input value={draft} onChange={(e) => setDraft(e.target.value)} type="password" required placeholder="Masukkan ADMIN_TOKEN"/></label><button className="button button-primary button-full">Buka dashboard</button></form><p className="privacy-note">Atur ADMIN_TOKEN di file .env server. Jangan masukkan token ke source code publik.</p></div></section>;

  return <section className="section admin-page"><div className="container">
    <div className="admin-heading"><div><p className="eyebrow">KOPI LOKAL · DASHBOARD STAF</p><h1>PEMBAYARAN <span>& PESANAN.</span></h1><p className="admin-updated">Pembaruan otomatis tiap 5 detik{lastUpdated ? ` · Terakhir diperbarui ${lastUpdated.toLocaleTimeString("id-ID")}` : ""}</p></div><button className="button button-secondary" onClick={load}><RefreshCw size={16}/> Perbarui</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {sales && <div className="sales-metrics"><article><span><Banknote size={18}/> Total omzet</span><strong>{formatIDR(sales.totalRevenue)}</strong><small>Pesanan dengan pembayaran berhasil</small></article><article><span><TrendingUp size={18}/> Omzet bulan ini</span><strong>{formatIDR(sales.monthRevenue)}</strong><small>Berdasarkan tanggal pemesanan</small></article><article><span><ShoppingBag size={18}/> Pembayaran berhasil</span><strong>{sales.paidOrders}</strong><small>Rata-rata {formatIDR(sales.averageOrderValue)} / pesanan</small></article><article><span><Clock3 size={18}/> Menunggu pembayaran</span><strong>{sales.pendingOrders}</strong><small>Belum masuk omzet</small></article></div>}
    <div className="payment-overview"><button className={`payment-filter-card ${paymentFilter === "all" ? "selected" : ""}`} onClick={() => setPaymentFilter("all")}><span>Semua pesanan</span><strong>{orders.length}</strong></button><button className={`payment-filter-card process ${paymentFilter === "process" ? "selected" : ""}`} onClick={() => setPaymentFilter("process")}><span><Timer size={16}/> Proses</span><strong>{orders.filter(o => paymentCategory(o.paymentStatus) === "process").length}</strong></button><button className={`payment-filter-card success ${paymentFilter === "success" ? "selected" : ""}`} onClick={() => setPaymentFilter("success")}><span><CheckCircle2 size={16}/> Berhasil</span><strong>{orders.filter(o => paymentCategory(o.paymentStatus) === "success").length}</strong></button><button className={`payment-filter-card cancelled ${paymentFilter === "cancelled" ? "selected" : ""}`} onClick={() => setPaymentFilter("cancelled")}><span><XCircle size={16}/> Dibatalkan</span><strong>{orders.filter(o => paymentCategory(o.paymentStatus) === "cancelled").length}</strong></button></div>
    <div className="admin-orders-title"><h2>Daftar pesanan</h2><span>{filteredOrders.length} dari {orders.length} pesanan</span></div>
    <div className="admin-order-tools"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, nomor pesanan, atau telepon…" aria-label="Cari pesanan"/><span>Status pembayaran dipisahkan dari proses pembuatan kopi.</span></div>
    {!filteredOrders.length ? <div className="admin-empty">Tidak ada pesanan yang cocok dengan filter ini.</div> : <div className="admin-orders">{filteredOrders.map((order) => {
      const category = paymentCategory(order.paymentStatus);
      const history = [...(order.history || [])].sort((a,b) => new Date(b.at) - new Date(a.at));
      return <article className="admin-order-card" key={order.orderId}>
        <div className="admin-order-top">
  <div>
    <p className="eyebrow">{order.orderId}</p>

    <h2>{order.customer?.name || "Pelanggan"}</h2>

    {order.paymentStatus === "paid" &&
      order.queueNumber != null && (
        <p className="admin-queue-number">
          Nomor antrean:{" "}
          <strong>
            {String(order.queueNumber).padStart(2, "0")}
          </strong>
        </p>
      )}

    <p>
      {order.customer?.phone || "-"} ·{" "}
      {order.customer?.address || "-"}
    </p>

    <a
      className="admin-whatsapp"
      href={`https://wa.me/${
        String(order.customer?.phone || "").replace(/\D/g, "") ||
        WHATSAPP_NUMBER
      }?text=${encodeURIComponent(
        `Halo ${order.customer?.name || "Pelanggan"}, kami dari Kopi Lokal terkait pesanan ${order.orderId}.`
      )}`}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle size={14} /> Hubungi pembeli via WhatsApp
    </a>
  </div>

  <div className="admin-order-total">
    <strong>{formatIDR(order.total)}</strong>
    <span className={`order-payment ${category}`}>
      {paymentLabels[category]}
    </span>
    <small>
      {paymentStatusLabels[order.paymentStatus] ||
        order.paymentStatus}
    </small>
  </div>
</div>
        <div className="order-time-grid"><div><small><Clock3 size={13}/> Waktu pesanan</small><strong>{dateTime(order.createdAt)}</strong></div><div><small><Banknote size={13}/> Pembayaran diperbarui</small><strong>{dateTime(order.updatedAt || order.createdAt)}</strong></div></div>
        <div className="admin-order-items">{order.items.map((item, i) => <span key={`${item.productId}-${i}`}>{item.quantity} × {item.name} ({item.grind})</span>)}</div>{order.customer.notes && <p className="admin-notes">Catatan: {order.customer.notes}</p>}
        <div className="admin-order-bottom"><div><span className={`order-status ${order.orderStatus}`}>{orderLabels[order.orderStatus] || order.orderStatus}</span><small className="order-current-time">Terakhir berubah: {dateTime(order.updatedAt || order.createdAt)}</small></div><label className="order-status-control">Proses pesanan<select aria-label={`Ubah status ${order.orderId}`} value={order.orderStatus} onChange={(e) => updateStatus(order.orderId, e.target.value)} disabled={order.paymentStatus !== "paid" && order.orderStatus !== "cancelled"}>{orderStatuses.map((status) => <option value={status} key={status}>{orderLabels[status]}</option>)}</select></label></div>
        <button className="history-toggle" onClick={() => setExpandedHistory(prev => ({ ...prev, [order.orderId]: !prev[order.orderId] }))}><History size={16}/>{expandedHistory[order.orderId] ? "Sembunyikan riwayat" : `Lihat riwayat (${history.length})`}</button>
        {expandedHistory[order.orderId] && <ol className="order-history">{history.length ? history.map((event, i) => <li key={`${event.at}-${i}`}><span className={`history-dot ${event.statusType}`}/><div><strong>{event.label || event.status}</strong><small>{dateTime(event.at)}</small></div></li>) : <li>Riwayat belum tersedia untuk pesanan lama.</li>}</ol>}
      </article>;
    })}</div>}
  </div></section>;
}
