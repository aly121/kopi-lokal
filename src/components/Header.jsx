
import {
  ShoppingBag,
  Menu,
  X,
  Coffee,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link
          to="/"
          className="wordmark"
          onClick={closeMenu}
          aria-label="Kopi Lokal home"
        >
          <span className="wordmark-icon">
            <Coffee size={20} strokeWidth={2.5} />
          </span>
          <span>
            KOPI LOKAL<span className="registered">®</span>
          </span>
        </Link>

        <button
          className="icon-button mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav
          className={`main-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <NavLink to="/" end onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/shop" onClick={closeMenu}>
            Shop all
          </NavLink>

          <NavLink to="/about" onClick={closeMenu}>
            Our story
          </NavLink>

          <NavLink to="/orders" onClick={closeMenu}>
            <ClipboardList size={17} />
            My Orders
          </NavLink>

          <Link
            className="cart-link"
            to="/cart"
            onClick={closeMenu}
          >
            <ShoppingBag size={18} />
            <span>Cart</span>
            <span className="cart-count">{itemCount}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
