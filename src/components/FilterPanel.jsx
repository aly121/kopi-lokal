export default function FilterPanel({ category, setCategory, roast, setRoast, sort, setSort }) {
  return (
    <div className="filter-panel">
      <label className="filter-control"><span>TYPE</span><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All coffee</option><option value="single-origin">Single origin</option><option value="blend">Blends</option></select></label>
      <label className="filter-control"><span>ROAST</span><select value={roast} onChange={(e) => setRoast(e.target.value)}><option value="all">All roasts</option><option value="light">Light</option><option value="medium">Medium</option><option value="dark">Dark</option></select></label>
      <label className="filter-control"><span>SORT BY</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A to Z</option></select></label>
    </div>
  );
}