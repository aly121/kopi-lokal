import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <section className="container not-found"><p className="eyebrow">404 / WRONG TURN</p><h1>THIS PAGE<br/><span>IS DECAF.</span></h1><p>Looks like this page isn't on our menu.</p><Link to="/" className="button button-dark"><ArrowLeft size={17}/> Back home</Link></section>;
}