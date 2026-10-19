// START HERE. This is the main file; run it with:  npm run dev

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ---- Middleware (runs on every request) ----
app.use(cors());                      // lets the React app (another port) call this server
app.use(express.json());              // lets us read JSON sent in req.body
app.use("/uploads", express.static("uploads")); // serves uploaded product pictures

// ---- Routes: each file handles one part of the store ----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/banners", require("./routes/banners"));
app.use("/api/reviews", require("./routes/reviews"));

// Admin panel (admins only -- each file checks this itself)
app.use("/api/admin/inventory", require("./routes/adminInventory"));
app.use("/api/admin/coupons", require("./routes/adminCoupons"));
app.use("/api/admin/banners", require("./routes/adminBanners"));
app.use("/api/admin/reviews", require("./routes/adminReviews"));
app.use("/api/admin/returns", require("./routes/adminReturns"));
app.use("/api/admin/reports", require("./routes/adminReports"));
app.use("/api/admin", require("./routes/admin")); // products, lists, orders, customers, dashboard

// Quick check that the server is alive.
app.get("/", (req, res) => {
  res.json({ message: "StyleHub API is running" });
});

// ---- Error handler ----
// If any route crashes unexpectedly, we land here instead of the server dying.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server" });
});

// Every 10 minutes, clean up online orders that were started but never paid.
const { releaseStaleOrders } = require("./utils/unpaidOrders");
setInterval(() => releaseStaleOrders().catch((error) => console.error("Cleanup failed:", error.message)), 10 * 60 * 1000);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
