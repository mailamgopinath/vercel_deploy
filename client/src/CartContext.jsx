import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "stylehub-cart";

function readCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(storedCart) ? storedCart : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(product, quantity = 1, options = {}) {
    const size = options.size || product.size || product.sizes?.[0] || "M";
    const productColor = options.color || product.color || product.colors?.[0] || "Default";
    const color = String(productColor).split("·").pop().trim();
    const lineId = `${product.name}:${size}:${color}`;
    const image = product.image || product.images?.[0] || "";

    setCartItems((items) => {
      const existingItem = items.find((item) => item.lineId === lineId);
      if (existingItem) {
        return items.map((item) => item.lineId === lineId
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }

      return [...items, {
        lineId,
        id: product.id,
        name: product.name,
        image,
        size,
        color,
        price: Number(product.price),
        quantity,
      }];
    });
  }

  function updateQuantity(lineId, change) {
    setCartItems((items) => items.map((item) => item.lineId === lineId
      ? { ...item, quantity: Math.max(1, item.quantity + change) }
      : item));
  }

  function removeFromCart(lineId) {
    setCartItems((items) => items.filter((item) => item.lineId !== lineId));
  }

  // Empty the bag (used after an order is placed).
  function clearCart() {
    setCartItems([]);
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return cart;
}