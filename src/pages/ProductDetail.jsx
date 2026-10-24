import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { formatIDR, titleCase } from "../utils/currency";
import ProductGrid from "../components/ProductGrid";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.slug === slug);
  const { addItem } = useCart();
  const [grind, setGrind] = useState("whole-bean");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return <section className="container section"><div className="empty-results"><h2>That coffee isn't on the shelf.</h2><Link to="/shop" className="button button-dark">Back to shop</Link></div></section>;
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  const handleAdd = () => { addItem(product, grind, quantity); setAdded(true); window.setTimeout(() => setAdded(false), 1800); };

  return (
    <>
      <section className="container product-detail-page">
        <Link to="/shop" className="back-link"><ArrowLeft size={16}/> Back to all coffee</Link>
        <div className="product-detail-grid">
          <div className={`detail-image detail-image-${product.color}`}><img src={product.image} alt={`${product.name} coffee`} /><span className="detail-image-label">KOPI LOKAL® / ORIGIN SERIES</span></div>
          <div className="detail-copy"><p className="eyebrow">{product.origin} · {titleCase(product.roastLevel)} roast</p><h1>{product.name}<span className="detail-period">.</span></h1><p className="detail-price">{formatIDR(product.price)} <span>/ {product.weightGrams} g</span></p><p className="detail-description">{product.description}</p><div className="tasting-box"><p className="eyebrow">TASTING NOTES</p><div className="tasting-pills">{product.tastingNotes.map((note) => <span key={note}>{note}</span>)}</div></div>
            <div className="option-group"><p className="option-label">CHOOSE YOUR GRIND</p><div className="choice-row">{product.availableGrinds.map((option) => <button key={option} className={`choice-button ${grind === option ? "is-selected" : ""}`} onClick={() => setGrind(option)} aria-pressed={grind === option}>{titleCase(option)} {grind === option && <Check size={14}/>}</button>)}</div></div>
            <div className="detail-buy-row"><div className="quantity-control quantity-large"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus size={16}/></button><span>{quantity}</span><button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} aria-label="Increase quantity"><Plus size={16}/></button></div><button className="button button-primary detail-add" onClick={handleAdd} disabled={product.stock < 1}>{added ? <><Check size={18}/> Added to bag</> : <><ShoppingBag size={18}/> Add · {formatIDR(product.price * quantity)}</>}</button></div>
            <p className="stock-note">{product.stock > 0 ? `${product.stock} packs available in this demo` : "Currently sold out"} · Shipping confirmed by chat</p>
            <div className="detail-benefits"><div><span>01</span><p><strong>Indonesian origins</strong><br/>A celebration of local coffee culture.</p></div><div><span>02</span><p><strong>Made for your ritual</strong><br/>Choose whole bean or ground.</p></div><div><span>03</span><p><strong>Easy ordering</strong><br/>Checkout with WhatsApp.</p></div></div>
            <button className="text-link detail-cart-link" onClick={() => navigate("/cart")}>Go to your bag <ArrowRight size={17}/></button>
          </div>
        </div>
      </section>
      <section className="section related-section"><div className="container"><div className="section-heading"><div><p className="eyebrow">KEEP EXPLORING</p><h2>MORE GOOD<br/><span>IN THE BAG.</span></h2></div><Link to="/shop" className="button button-outline">See all coffee <ArrowRight size={17}/></Link></div><ProductGrid products={related}/></div></section>
    </>
  );
}