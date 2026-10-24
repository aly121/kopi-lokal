import { ArrowDownRight, ArrowRight, Coffee, Leaf, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ProductGrid from "../components/ProductGrid";
import { products } from "../data/products";

export default function Home() {
  const featured = products.filter((product) => product.featured).slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> INDONESIAN COFFEE, BIG PERSONALITY</p>
            <h1>GOOD<br />BEANS.<br /><span className="hero-highlight">BIG ENERGY.</span></h1>
            <p className="hero-description">From highland farms to your favourite mug. Meet the Indonesian beans that make ordinary mornings feel like something.</p>
            <div className="hero-actions"><Link to="/shop" className="button button-primary">Find your coffee <ArrowRight size={18} /></Link><Link to="/about" className="text-link">Meet Kopi Lokal <ArrowDownRight size={17} /></Link></div>
            <div className="hero-proof"><div className="proof-icons"><span><Leaf size={16}/></span><span><Coffee size={16}/></span><span><MapPin size={16}/></span></div><p>Local origins. Thoughtful brews.<br /><strong>Always good energy.</strong></p></div>
          </div>
          <div className="hero-art" aria-label="Coffee beans and coffee cup illustration">
            <div className="hero-sticker sticker-top"><Sparkles size={17} /> BREW HAPPY</div>
            <div className="hero-orbit orbit-one"></div><div className="hero-orbit orbit-two"></div>
            <div className="hero-photo"><img src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=90" alt="Freshly prepared coffee in a cafe" /></div>
            <div className="hero-burst">100%<br/><span>GOOD<br/>MOOD</span></div>
            <div className="hero-caption"><span>01 / THE DAILY RITUAL</span><span>SCROLL TO SIP ↓</span></div>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true"><div>LOCAL BEANS <span>✳</span> BIG FLAVOUR <span>✳</span> GOOD ENERGY <span>✳</span> LOCAL BEANS <span>✳</span> BIG FLAVOUR <span>✳</span> GOOD ENERGY <span>✳</span></div></div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading"><div><p className="eyebrow">THE GOOD STUFF</p><h2>MEET YOUR<br/><span>NEW DAILY.</span></h2></div><Link to="/shop" className="button button-outline">Shop all coffee <ArrowRight size={17}/></Link></div>
          <ProductGrid products={featured}/>
        </div>
      </section>

      <section className="origin-section">
        <div className="container origin-grid">
          <div className="origin-image"><img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=85" alt="Roasted coffee beans ready to brew" loading="lazy"/><span className="image-stamp">GROWN<br/>WITH<br/>PURPOSE ✳</span></div>
          <div className="origin-copy"><p className="eyebrow">A LITTLE ABOUT US</p><h2>FROM HERE.<br/><span>FOR EVERYWHERE.</span></h2><p>Indonesia has a coffee story worth sharing. Kopi Lokal is a fictional celebration of the people, places, and everyday rituals behind a really good cup.</p><p>We're here for curious drinkers, slow mornings, and the little moments that deserve better coffee.</p><Link to="/about" className="text-link">Get to know us <ArrowRight size={17}/></Link><div className="origin-stats"><div><strong>06</strong><span>BEAN DROPS</span></div><div><strong>01</strong><span>SHARED LOVE</span></div><div><strong>100%</strong><span>COFFEE PEOPLE</span></div></div></div>
        </div>
      </section>

      <section className="closing-cta"><div className="container closing-inner"><p className="eyebrow">YOUR NEXT CUP IS CALLING</p><h2>MAKE ROOM<br/>FOR <span>GOOD.</span></h2><Link to="/shop" className="button button-dark">Shop the collection <ArrowRight size={18}/></Link><span className="cta-spark cta-spark-one">✳</span><span className="cta-spark cta-spark-two">✳</span></div></section>
    </>
  );
}