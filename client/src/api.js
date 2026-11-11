// One place for talking to the backend.
// Other files do:  import api from "./api";   then   api.get("/products")

import axios from "axios";

// In production VITE_API_URL is the backend address (e.g. https://xxx.onrender.com).
// Locally it is empty, so "/api" goes through the Vite proxy to localhost:5000.
const API_URL = import.meta.env.VITE_API_URL || "";
const api = axios.create({ baseURL: `${API_URL}/api` });

// Uploaded pictures live on the backend ("/uploads/..."). When the frontend is on a
// different address, point those paths at the backend so the images load.
api.interceptors.response.use((response) => {
  if (API_URL && response.data && typeof response.data === "object") {
    response.data = JSON.parse(
      JSON.stringify(response.data).replace(/"\/uploads\//g, `"${API_URL}/uploads/`)
    );
  }
  return response;
});

// Before EVERY request, attach the login token (if the user is logged in).
// The server reads it to know who is making the request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stylehub-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The database uses names like "old_price". Our React pages expect "oldPrice",
// a numeric rating, and a few extra fields. This converts one product.
export function normalizeProduct(p) {
  const price = Number(p.price);
  const oldPrice = Number(p.old_price) || price;
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    subcategory: p.sub_category,
    brand: p.brand,
    size: p.size,
    color: p.color,
    price,
    oldPrice,
    rating: Number(p.rating),
    stock: p.stock,
    image: p.image,
    discount: Math.round(((oldPrice - price) / oldPrice) * 100),
    popularity: Number(p.rating) * 20, // simple: higher rating = more popular
    newest: p.id,                      // simple: bigger id = added later
    label: p.brand,
  };
}

// Fetch products from the server. "filters" is optional, e.g. { category: "Men" }
export async function fetchProducts(filters = {}) {
  const response = await api.get("/products", { params: filters });
  return response.data.map(normalizeProduct);
}

// Pull a readable message out of a failed request.
export function errorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  // A plain Error (for example "could not load the payment window") already has a good message.
  return error.isAxiosError ? "Could not reach the server" : error.message || "Something went wrong";
}

export default api;
