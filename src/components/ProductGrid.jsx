import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  if (!products.length) {
    return <div className="empty-results"><span className="empty-symbol">?</span><h3>No beans found.</h3><p>Try a different search or clear your filters.</p></div>;
  }
  return <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>;
}