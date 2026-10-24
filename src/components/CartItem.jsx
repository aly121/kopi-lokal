import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatIDR, titleCase } from "../utils/currency";

export default function CartItem({ item, product, onQuantityChange, onRemove }) {
  if (!product) return null;
  return (
    <article className="cart-item">
      <Link to={`/product/${product.slug}`} className="cart-item-image"><img src={product.image} alt={product.name} /></Link>
      <div className="cart-item-detail">
        <div className="cart-item-top"><div><p className="eyebrow">{product.origin}</p><Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link><p className="cart-option">{titleCase(item.grind)} · {product.weightGrams} g</p></div><strong>{formatIDR(product.price * item.quantity)}</strong></div>
        <div className="cart-item-bottom">
          <div className="quantity-control" aria-label={`Quantity for ${product.name}`}><button onClick={() => onQuantityChange(item.productId, item.grind, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => onQuantityChange(item.productId, item.grind, item.quantity + 1)} disabled={item.quantity >= product.stock} aria-label="Increase quantity"><Plus size={14} /></button></div>
          <button className="text-button remove-button" onClick={() => onRemove(item.productId, item.grind)}><Trash2 size={14} /> Remove</button>
        </div>
      </div>
    </article>
  );
}