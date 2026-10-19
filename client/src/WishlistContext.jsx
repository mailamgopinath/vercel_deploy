// Keeps the list of hearted product ids, saved on the server for the logged-in user.
// Any component can do:  const { wishlistIds, toggleWishlist } = useWishlist();

import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistIds, setWishlistIds] = useState([]);

  // Whenever the user logs in or out, reload (or clear) their saved list.
  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      return;
    }
    api.get("/wishlist").then((response) => {
      setWishlistIds(response.data.map((product) => product.id));
    });
  }, [user]);

  // Heart / un-heart a product.
  async function toggleWishlist(productId) {
    if (!user) {
      navigate("/login"); // must be logged in to save things
      return;
    }

    if (wishlistIds.includes(productId)) {
      await api.delete(`/wishlist/${productId}`);
      setWishlistIds((ids) => ids.filter((id) => id !== productId));
    } else {
      await api.post(`/wishlist/${productId}`);
      setWishlistIds((ids) => [...ids, productId]);
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
