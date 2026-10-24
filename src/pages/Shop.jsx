import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import { products } from "../data/products";

export default function Shop() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [roast, setRoast] = useState("all");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesQuery = !normalized || [product.name, product.origin, ...product.tastingNotes].some((value) => value.toLowerCase().includes(normalized));
      return matchesQuery && (category === "all" || product.category === category) && (roast === "all" || product.roastLevel === roast);
    });
    return result.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured);
    });
  }, [query, category, roast, sort]);

  const reset = () => { setQuery(""); setCategory("all"); setRoast("all"); setSort("featured"); };

  return (
    <section className="shop-page section">
      <div className="container">
        <div className="shop-hero"><p className="eyebrow"><span className="eyebrow-dot"/> THE FULL LINE-UP</p><h1>FIND YOUR<br/><span>FAVOURITE.</span></h1><p>Different places. Different personalities. One very good reason to get out of bed.</p><div className="shop-count"><strong>{filtered.length.toString().padStart(2,"0")}</strong> COFFEES TO EXPLORE</div></div>
        <div className="shop-tools"><SearchBar value={query} onChange={setQuery}/><div className="filter-label"><SlidersHorizontal size={16}/> MAKE IT YOURS</div><FilterPanel category={category} setCategory={setCategory} roast={roast} setRoast={setRoast} sort={sort} setSort={setSort}/></div>
        <div className="results-line"><span>SHOWING {filtered.length} OF {products.length} PRODUCTS</span><button className="text-button" onClick={reset}>Reset filters ↺</button></div>
        <ProductGrid products={filtered}/>
      </div>
    </section>
  );
}