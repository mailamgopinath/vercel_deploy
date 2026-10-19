// Admin: stock for each size + color of a product.
//   GET    /api/admin/inventory         all rows
//   POST   /api/admin/inventory         add a row (or update it if that size + color exists)
//   PUT    /api/admin/inventory/:id     change the stock number
//   DELETE /api/admin/inventory/:id     remove a row
//
// After every change the product's total stock is recalculated.

const express = require("express");
const db = require("../db");
const { loginRequired, adminOnly } = require("../middleware/auth");
const { recalcStock } = require("../utils/products");

const router = express.Router();
router.use(loginRequired, adminOnly);

router.get("/", async (req, res) => {
  const [rows] = await db.query(
    `SELECT product_variants.*, products.name AS product_name
     FROM product_variants
     JOIN products ON products.id = product_variants.product_id
     ORDER BY products.name, product_variants.size, product_variants.color`
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { product_id, size, color } = req.body;
  const stock = Number(req.body.stock);

  if (!product_id || !size || !color || !Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ message: "Product, size, color and a stock number are required" });
  }

  // Same product + size + color twice? Just update the stock.
  await db.query(
    `INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
    [product_id, size, color, stock]
  );
  await recalcStock(product_id);
  res.status(201).json({ message: "Saved" });
});

router.put("/:id", async (req, res) => {
  const stock = Number(req.body.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ message: "Stock must be 0 or more" });
  }

  const [rows] = await db.query("SELECT product_id FROM product_variants WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: "Not found" });

  await db.query("UPDATE product_variants SET stock = ? WHERE id = ?", [stock, req.params.id]);
  await recalcStock(rows[0].product_id);
  res.json({ message: "Updated" });
});

router.delete("/:id", async (req, res) => {
  const [rows] = await db.query("SELECT product_id FROM product_variants WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: "Not found" });

  await db.query("DELETE FROM product_variants WHERE id = ?", [req.params.id]);
  // If that was the last row, the product keeps its current stock number.
  await recalcStock(rows[0].product_id);
  res.json({ message: "Deleted" });
});

module.exports = router;
