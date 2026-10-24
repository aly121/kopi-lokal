import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, CreditCard, QrCode, ShieldCheck, ShoppingBag, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { formatIDR } from "../utils/currency";
import { WHATSAPP_NUMBER } from "../config";

export default function Cart() {
  const { items, subtotal, productsById, setQuantity, removeItem, clearCart } = useCart();
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);

  const updateCustomer = (event) => {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: "" }));
  };


  useEffect(() => {
    if (!payment?.orderId) return undefined;
    let active = true;
    const check = async () => {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(payment.orderId)}`
        );
        if (!response.ok) {
          console.error(
            "Failed to check order status:",
            response.status
          );
          return;
        }
        // Baca respons sebagai teks terlebih dahulu.
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error(
            "Invalid JSON while checking order status:",
            responseText.slice(0, 300)
          );
          return;
        }
        if (!active) return;
        setOrderStatus(data);
        if (data.paymentStatus === "paid") {
          clearCart();
        }
      } catch (error) {
        console.error("Could not check payment status:", error);
      }
    };
    check();
    const interval = window.setInterval(check, 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [payment?.orderId, clearCart]);


  
  const createPayment = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!customer.name.trim()) {
      nextErrors.name = "Enter your name.";
    }

    if (!customer.phone.trim()) {
      nextErrors.phone = "Enter a phone number.";
    }

    if (!customer.address.trim()) {
      nextErrors.address =
        "Enter a delivery address or pickup instructions.";
    }

    if (!items.length) {
      nextErrors.cart = "Your cart is empty.";
    }

    const invalidItem = items.find(
      (item) =>
        !productsById[item.productId] ||
        item.quantity > productsById[item.productId].stock
    );

    if (invalidItem) {
      nextErrors.cart =
        "One or more quantities exceed the current demo stock.";
    }

    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length) return;

    setBusy(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create payment.");
      }
      console.log("Order response:", data);
      setPayment(data);
      try {
        const savedOrderIds = JSON.parse(
          localStorage.getItem("kopi-local-order-ids") || "[]"
        );

        if (data.orderId && !savedOrderIds.includes(data.orderId)) {
          localStorage.setItem(
            "kopi-local-order-ids",
            JSON.stringify([data.orderId, ...savedOrderIds])
          );
        }
      } catch (error) {
        console.error("Could not save order ID:", error);
      }

      setOrderStatus({
        paymentStatus: data.paymentStatus,
        orderStatus: "awaiting_payment",
        queueNumber: null,
        queueDate: null,
      });
    } catch (error) {
      setMessage(
        error.message || "Could not connect to the payment service."
      );
    } finally {
      setBusy(false);
    }
  };  

  
if (payment) {
  const isPaid = orderStatus?.paymentStatus === "paid";

  const orderLabels = {
    awaiting_payment: "Menunggu pembayaran",
    new: "Pesanan diterima",
    preparing: "Sedang diproses",
    ready: "Siap di-pick up",
    completed: "Pesanan selesai",
    cancelled: "Dibatalkan",
  };

  return (
    <section className="cart-page section">
      <div className="container">
        <div className="payment-panel">
          {isPaid ? (
            <CheckCircle2
              size={48}
              className="payment-success-icon"
            />
          ) : (
            <QrCode size={48} className="payment-qr-icon" />
          )}

          <p className="eyebrow">ORDER {payment.orderId}</p>

          <h1>
            {isPaid ? (
              <>
                PAYMENT <span>CONFIRMED.</span>
              </>
            ) : (
              <>
                SCAN. PAY. <span>BREW.</span>
              </>
            )}
          </h1>

          <p className="payment-lede">
            {isPaid
              ? "Pembayaran berhasil. Pesananmu telah dikirim ke toko."
              : "Pindai kode QRIS menggunakan aplikasi bank atau dompet digital. Status akan diperbarui otomatis."}
          </p>

          {isPaid ? (
            <>
              <div className="payment-status-pill paid">
                <CheckCircle2 size={16} />
                PEMBAYARAN BERHASIL
              </div>

              <div className="payment-total">
                <span>NOMOR ANTREAN</span>
                <strong>
                  {orderStatus?.queueNumber != null
                    ? String(orderStatus.queueNumber).padStart(2, "0")
                    : "Menyiapkan antrean..."}
                </strong>
              </div>

              <div className="payment-status-pill">
                STATUS:{" "}
                {orderLabels[orderStatus?.orderStatus] ||
                  "Menunggu konfirmasi"}
              </div>
            </>
          ) : (
            <>
              {payment.qrUrl ? (
                <img
                  className="payment-qr-image"
                  src={payment.qrUrl}
                  alt="Kode pembayaran QRIS"
                />
              ) : (
                <p className="form-error">
                  Kode QRIS tidak tersedia. Hubungi toko dan
                  sertakan nomor pesananmu.
                </p>
              )}

              <div className="payment-total">
                <span>JUMLAH PEMBAYARAN</span>
                <strong>{formatIDR(payment.total)}</strong>
              </div>

              <div className="payment-status-pill">
                <Clock3 size={16} />
                {orderStatus?.paymentStatus === "expired"
                  ? "PEMBAYARAN KEDALUWARSA"
                  : "MENUNGGU KONFIRMASI PEMBAYARAN"}
              </div>
            </>
          )}

          <Link to="/shop" className="button button-primary">
            Back to the shop <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}


  return (
    <section className="cart-page section"><div className="container">
      <Link to="/shop" className="back-link"><ArrowLeft size={16}/> Keep browsing</Link>
      <div className="cart-heading"><div><p className="eyebrow">YOUR PICKS, YOUR RITUAL</p><h1>YOUR <span>BAG.</span></h1></div><span className="cart-heading-count">{items.reduce((sum, item) => sum + item.quantity, 0).toString().padStart(2, "0")} ITEMS</span></div>
      {items.length === 0 ? <div className="cart-empty"><div className="empty-bag-icon"><ShoppingBag size={34}/></div><p className="eyebrow">NOTHING BREWING YET</p><h2>YOUR BAG IS<br/><span>FEELING EMPTY.</span></h2><p>Let's fix that. Find a coffee that feels like you.</p><Link to="/shop" className="button button-primary">Explore the coffee <ArrowRight size={17}/></Link></div> : (
        <div className="cart-layout"><div className="cart-items-column"><div className="cart-column-heading"><span>YOUR COFFEE ({items.length})</span><span>SUBTOTAL</span></div>{items.map((item) => <CartItem key={`${item.productId}:${item.grind}`} item={item} product={productsById[item.productId]} onQuantityChange={setQuantity} onRemove={removeItem}/>)}{errors.cart && <p className="form-error">{errors.cart}</p>}<Link to="/shop" className="text-link continue-link"><ArrowLeft size={16}/> Add more good stuff</Link></div>
          <aside className="order-summary"><p className="eyebrow">THE NUMBERS</p><h2>ORDER<br/>SUMMARY<span>.</span></h2><div className="summary-line"><span>Subtotal</span><strong>{formatIDR(subtotal)}</strong></div><div className="summary-line"><span>Shipping</span><span className="shipping-note">Confirm before launch</span></div><div className="summary-line"><span>Payment</span><span className="shipping-note">Dynamic QRIS</span></div><div className="summary-total"><span>EST. TOTAL</span><strong>{formatIDR(subtotal)}</strong></div><p className="summary-disclaimer">Shipping cost is not included in this portfolio demo. Confirm shipping rules before using with real customers.</p>
            {!showForm ? <button className="button button-primary button-full" onClick={() => setShowForm(true)}>Continue to QRIS <QrCode size={18}/></button> : <form className="checkout-form" onSubmit={createPayment} noValidate><h3>Where should we send it?</h3>
              <label className="form-field">Full name<input name="name" value={customer.name} onChange={updateCustomer} autoComplete="name" aria-invalid={Boolean(errors.name)} placeholder="Your name"/>{errors.name && <span className="form-error">{errors.name}</span>}</label>
              <label className="form-field">Phone number<input name="phone" value={customer.phone} onChange={updateCustomer} autoComplete="tel" aria-invalid={Boolean(errors.phone)} placeholder="08xxxxxxxxxx"/>{errors.phone && <span className="form-error">{errors.phone}</span>}</label>
              <label className="form-field">Delivery address / pickup details<textarea name="address" value={customer.address} onChange={updateCustomer} autoComplete="street-address" rows="3" aria-invalid={Boolean(errors.address)} placeholder="Address or pickup instructions"/>{errors.address && <span className="form-error">{errors.address}</span>}</label>
              <label className="form-field">Order notes <span className="optional">(optional)</span><textarea name="notes" value={customer.notes} onChange={updateCustomer} rows="2" placeholder="Grind preference or other notes"/></label>
              {message && <p className="form-error">{message}</p>}
              <button className="button button-primary button-full" type="submit" disabled={busy}>{busy ? "Creating secure payment…" : "Create QRIS payment"} <CreditCard size={18}/></button>
              <p className="privacy-note"><ShieldCheck size={14}/> Payment is confirmed by the server through Midtrans notifications, not by a customer button.</p>
            </form>}
            <a className="cart-whatsapp-link" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo Kopi Lokal, saya ingin bertanya tentang produk dan pemesanan kopi.")}`} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Ada pertanyaan? Hubungi toko via WhatsApp</a><div className="secure-note"><QrCode size={17}/><span><strong>Dynamic QRIS checkout.</strong><br/>Order status updates after payment confirmation.</span></div>
          </aside></div>)}
    </div></section>
  );
}
