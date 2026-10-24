import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { products } from "../data/products";

const CartContext = createContext(null);
const STORAGE_KEY = "kopi-lokal-cart-v1";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product && product.availableGrinds.includes(item.grind)
        && Number.isInteger(item.quantity) && item.quantity > 0;
    }).map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return { ...item, quantity: Math.min(item.quantity, product.stock) };
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be unavailable; cart still works for this session.
    }
  }, [items]);

  const addItem = (product, grind = "whole-bean", quantity = 1) => {
    if (!product || product.stock < 1 || !product.availableGrinds.includes(grind)) return;
    setItems((current) => {
      const key = `${product.id}:${grind}`;
      const existing = current.find((item) => `${item.productId}:${item.grind}` === key);
      if (!existing) {
        return [...current, { productId: product.id, grind, quantity: Math.min(quantity, product.stock) }];
      }
      return current.map((item) => {
        if (`${item.productId}:${item.grind}` !== key) return item;
        return { ...item, quantity: Math.min(product.stock, item.quantity + quantity) };
      });
    });
  };

  const setQuantity = (productId, grind, quantity) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => !(item.productId === productId && item.grind === grind)));
      return;
    }
    setItems((current) => current.map((item) =>
      item.productId === productId && item.grind === grind
        ? { ...item, quantity: Math.min(product.stock, Math.floor(quantity)) }
        : item
    ));
  };

  const removeItem = (productId, grind) => {
    setItems((current) => current.filter((item) => !(item.productId === productId && item.grind === grind)));
  };
  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const productsById = Object.fromEntries(products.map((product) => [product.id, product]));
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (productsById[item.productId]?.price || 0) * item.quantity, 0);
    return { items, itemCount, subtotal, productsById, addItem, setQuantity, removeItem, clearCart };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}