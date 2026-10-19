// The frame around every admin page: a sidebar on the left, the page on the right.
// It also keeps non-admins out.

import React from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./admin.css";

// Sidebar links. To add a new admin page later, add a line here.
const links = [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/brands", "Brands"],
  ["/admin/sizes", "Sizes"],
  ["/admin/colors", "Colors"],
  ["/admin/inventory", "Inventory"],
  ["/admin/orders", "Orders"],
  ["/admin/returns", "Returns"],
  ["/admin/customers", "Customers"],
  ["/admin/coupons", "Coupons"],
  ["/admin/banners", "Banners"],
  ["/admin/reviews", "Reviews"],
  ["/admin/reports", "Reports"],
];

function AdminLayout() {
  const { user, logout } = useAuth();

  // Not logged in -> login page. Logged in but not an admin -> home page.
  // (The server also checks this, so hiding pages here is just for convenience.)
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="adm-shell">
      <nav className="adm-sidebar">
        <h2>StyleHub Admin</h2>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
            {label}
          </NavLink>
        ))}
        <div className="adm-spacer" />
        <NavLink to="/">← View shop</NavLink>
        <a href="/" onClick={logout}>Log out</a>
      </nav>

      <main className="adm-main">
        {/* The page for the current address (Dashboard, Products ...) appears here */}
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
