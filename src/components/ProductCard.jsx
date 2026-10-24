import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatIDR, titleCase } from "../utils/currency";

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  return (
    <article className={`product-card product-card-${product.color}`} style={{ "--card-index": index }}>
      <Link to={`/product/${product.slug}`} className="product-image-wrap" aria-label={`View ${product.name}`}>
        <img src={product.image} alt={`${product.name} coffee product`} loading={index > 2 ? "lazy" : "eager"} />
        {product.featured && <span className="product-tag">STAFF PICK</span>}
        <span className="image-arrow"><ArrowUpRight size={19} /></span>
      </Link>
      <div className="product-card-info">
        <div className="product-meta"><span>{product.origin}</span><span>{titleCase(product.roastLevel)} roast</span></div>
        <div className="product-title-row"><Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link><span className="product-price">{formatIDR(product.price)}</span></div>
        <p className="tasting-notes">{product.tastingNotes.join(" · ")}</p>
        <button className="button button-dark button-full add-button" onClick={() => addItem(product, "whole-bean")} disabled={product.stock < 1}>
          <ShoppingBag size={16} /> {product.stock < 1 ? "Sold out" : "Add to bag"}
        </button>
      </div>
    </article>
  );
}