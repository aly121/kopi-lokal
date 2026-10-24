import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AnnouncementBar from "./components/AnnouncementBar";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import AdminOrders from "./pages/AdminOrders";
import FloatingCart from "./components/FloatingCart";
import ScrollToTop from "./components/ScrollToTop";
import MyOrders from "./pages/MyOrders";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <FloatingCart />
      <Footer />
    </>
  );
}