// Products that CUSTOMERS see. Anyone can use these.
//   GET /api/products        list (with optional filters)
//   GET /api/products/:id    one product
//
// Adding / editing / deleting products is for admins -- see routes/admin.js.
// Products with status "inactive" are hidden here.

const express = require("express");
const db = require("../db");

const router = express.Router();

// Example: /api/products?category=Men&maxPrice=1500&sort=price_low&search=shirt
router.get("/", async (req, res) => {
  const { category, size, color, brand, minRating, maxPrice, search, sort } = req.query;

  // Build the WHERE part step by step. Only add a filter if the user sent it.
  // The "?" marks are filled from the "values" list -- this blocks SQL injection.
  let sql = "SELECT * FROM products WHERE status = 'active'";
  const values = [];

  if (category)  { sql += " AND category = ?";  values.push(category); }
  if (size)      { sql += " AND size = ?";      values.push(size); }
  if (color)     { sql += " AND color = ?";     values.push(color); }
  if (brand)     { sql += " AND brand = ?";     values.push(brand); }
  if (minRating) { sql += " AND rating >= ?";   values.push(minRating); }
  if (maxPrice)  { sql += " AND price <= ?";    values.push(maxPrice); }
  if (search)    { sql += " AND name LIKE ?";   values.push(`%${search}%`); }

  // Sorting. We pick from a fixed list instead of using user text directly.
  if (sort === "price_low")       sql += " ORDER BY price ASC";
  else if (sort === "price_high") sql += " ORDER BY price DESC";
  else if (sort === "rating")     sql += " ORDER BY rating DESC";
  else                            sql += " ORDER BY created_at DESC"; // newest

  const [products] = await db.query(sql, values);
  res.json(products);
});

router.get("/:id", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM products WHERE id = ? AND status = 'active'",
    [req.params.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "Product not found" });
  }

  const [variants] = await db.query(
    "SELECT size, color FROM product_variants WHERE product_id = ? ORDER BY size, color",
    [req.params.id]
  );

  res.json({
    ...rows[0],
    sizes: [...new Set(variants.map((variant) => variant.size))],
    colors: [...new Set(variants.map((variant) => variant.color))],
  });
});

module.exports = router;
