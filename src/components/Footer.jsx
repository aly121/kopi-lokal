import { ArrowUpRight, Instagram, MapPin, MessageCircle, Navigation } from "lucide-react";
import { STORE_ADDRESS, STORE_HOURS, STORE_MAP_QUERY, WHATSAPP_NUMBER } from "../config";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <p className="eyebrow footer-eyebrow">GROWN HERE. BREWED ANYWHERE.</p>
          <h2>MAKE YOUR<br /><span>DAY A LITTLE</span><br />BETTER.</h2>
        </div>
        <div className="footer-links">
          <div><p className="footer-label">EXPLORE</p><Link to="/shop">Shop coffee</Link><Link to="/about">Our story</Link><Link to="/cart">Your cart</Link></div>
          <div><p className="footer-label">SAY HELLO</p><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a><a href="mailto:hello@kopilokal.example">Email us <ArrowUpRight size={14} /></a></div>
        </div>
      </div>
      <div className="container footer-location" id="lokasi-toko">
        <div className="footer-location-copy"><p className="footer-label"><MapPin size={14}/> VISIT OUR CORNER</p><h3>FIND YOUR<br/><span>WAY TO US.</span></h3><p>{STORE_ADDRESS}</p><p>{STORE_HOURS}</p><div className="footer-location-actions"><a className="button button-dark" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAP_QUERY)}`} target="_blank" rel="noreferrer"><Navigation size={16}/> Buka Petunjuk Arah</a><a className="button button-outline" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"><MessageCircle size={16}/> WhatsApp toko</a></div><small>Ganti alamat demo dan nomor WhatsApp pada src/config.js sebelum situs dipublikasikan.</small></div>
        <div className="footer-map"><iframe title="Lokasi toko Kopi Lokal" src={`https://maps.google.com/maps?q=${encodeURIComponent(STORE_MAP_QUERY)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 KOPI LOKAL — FICTIONAL PORTFOLIO BRAND</span><span>MADE WITH CARE <Instagram size={13} /></span></div>
    </footer>
  );
}