import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <label className="search-field">
      <Search size={18} aria-hidden="true" />
      <span className="sr-only">Search coffee</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search your next favourite..." />
      {value && <button type="button" className="clear-search" onClick={() => onChange("")} aria-label="Clear search"><X size={16} /></button>}
    </label>
  );
}