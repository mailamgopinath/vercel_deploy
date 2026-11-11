// START HERE. This is the main file; run it with:  npm run dev

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { cacheGets, clearCacheOnChanges } = require("./utils/cache");

const app = express();
app.set("trust proxy", 1); // on Render the real visitor address comes from the proxy

// ---- Middleware (runs on every request) ----
// Only these websites may call the API with the login cookie. Add more with CLIENT_URL
// (comma separated), for example your own domain.
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://vercel-deploy-frontend.onrender.com",
  ...(process.env.CLIENT_URL || "").split(",").map((url) => url.trim().replace(/\/$/, "")).filter(Boolean),
];
app.use(cors({ origin: allowedOrigins, credentials: true })); // credentials: lets the cookie travel
app.use(cookieParser());              // lets us read the login cookie
// Protection against CSRF: a change request (POST/PUT/DELETE) from any other website is refused.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Request not allowed from this website" });
  }
  next();
});
app.use(compression());               // smaller responses = faster pages
app.use(express.json());              // lets us read JSON sent in req.body
app.use("/uploads", express.static("uploads")); // serves uploaded product pictures

// Rate limits: one visitor can't flood the server and slow everyone else down.
const tooMany = { message: "Too many requests, please try again in a moment" };
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 300, message: tooMany }));          // 300 / minute
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: tooMany })); // login: 30 / 15 min

// Cache: public pages are saved for a short time; any change by an admin or an order clears them.
app.use("/api", clearCacheOnChanges);
app.use("/api/products", cacheGets(30));
app.use("/api/banners", cacheGets(60));

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
