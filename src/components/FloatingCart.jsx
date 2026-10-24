import { ShoppingCart, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatIDR } from "../utils/currency";

export default function FloatingCart() {
  const { itemCount, subtotal } = useCart();
  const location = useLocation();
  if (!itemCount || location.pathname === "/cart" || location.pathname.startsWith("/admin")) return null;
  return (
    <Link className="floating-cart" to="/cart" aria-label={`Open cart, ${itemCount} items, total ${formatIDR(subtotal)}`}>
      <span className="floating-cart-icon"><ShoppingCart size={21} /><span className="floating-cart-count">{itemCount}</span></span>
      <span className="floating-cart-copy"><strong>Lihat keranjang</strong><small>{itemCount} item · {formatIDR(subtotal)}</small></span>
      <ArrowRight size={18} />
    </Link>
  );
}
