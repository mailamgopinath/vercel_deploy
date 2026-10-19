import React from "react";
import "./index.css";
import "./App.css";
import "./theme.css";
import {BrowserRouter as Router,Routes,Route,Navigate} from "react-router-dom";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Category from "./pages/Category";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import AdminProducts from "./admin/Products";
import Lists from "./admin/Lists";
import AdminOrders from "./admin/Orders";
import Customers from "./admin/Customers";
import Inventory from "./admin/Inventory";
import Coupons from "./admin/Coupons";
import Banners from "./admin/Banners";
import AdminReviews from "./admin/Reviews";
import Returns from "./admin/Returns";
import Reports from "./admin/Reports";
import Invoice from "./admin/Invoice";
import { CartProvider } from "./CartContext";
import { AuthProvider } from "./AuthContext";
import { WishlistProvider } from "./WishlistContext";
function App() {
    return (
        <AuthProvider>
        <CartProvider>
            <Router>
                <WishlistProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Admin panel: every page below shows inside AdminLayout's sidebar */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="categories" element={<Lists title="Categories" endpoint="categories" withParent />} />
                        <Route path="brands" element={<Lists title="Brands" endpoint="brands" />} />
                        <Route path="sizes" element={<Lists title="Sizes" endpoint="sizes" />} />
                        <Route path="colors" element={<Lists title="Colors" endpoint="colors" />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="orders/:id/invoice" element={<Invoice />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="returns" element={<Returns />} />
                        <Route path="coupons" element={<Coupons />} />
                        <Route path="banners" element={<Banners />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="reports" element={<Reports />} />
                    </Route>

                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/men" element={<Category category="men" />} />
                    <Route path="/women" element={<Category category="women" />} />
                    <Route path="/kids" element={<Category category="kids" />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/orders" element={<MyOrders />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                </Routes>
                </WishlistProvider>
            </Router>
        </CartProvider>
        </AuthProvider>
    );
}
export default App;