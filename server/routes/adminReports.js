// Admin: reports.
//   GET /api/admin/reports/:type?from=2026-01-01&to=2026-12-31
// type is one of: sales, orders, products, customers, inventory
//
// Every report answers in the same shape, so one page can show any of them:
//   { columns: ["Date", "Orders", ...], rows: [ ["2026-10-01", 3, ...], ... ] }
// Cancelled and returned orders are not counted as sales.

const express = require("express");
const db = require("../db");
const { loginRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(loginRequired, adminOnly);

const counted = "orders.status NOT IN ('cancelled', 'returned', 'awaiting_payment')";

router.get("/:type", async (req, res) => {
  const { from, to } = req.query;

  // Optional date filter on orders. Starts with AND so it can follow a WHERE.
  let dateFilter = "";
  const dateValues = [];
  if (from) { dateFilter += " AND DATE(orders.created_at) >= ?"; dateValues.push(from); }
  if (to)   { dateFilter += " AND DATE(orders.created_at) <= ?"; dateValues.push(to); }

  let columns;
  let rows;

  if (req.params.type === "sales") {
    columns = ["Date", "Orders", "Sales (₹)"];
    [rows] = await db.query(
      `SELECT DATE_FORMAT(orders.created_at, '%Y-%m-%d') AS day, COUNT(*), SUM(orders.total)
       FROM orders WHERE ${counted} ${dateFilter}
       GROUP BY day ORDER BY day`,
      dateValues
    );
  } else if (req.params.type === "orders") {
    columns = ["Order #", "Date", "Customer", "Status", "Total (₹)"];
    [rows] = await db.query(
      `SELECT orders.id, DATE_FORMAT(orders.created_at, '%Y-%m-%d'), users.name, orders.status, orders.total
       FROM orders JOIN users ON users.id = orders.user_id
       WHERE orders.status <> 'awaiting_payment' ${dateFilter}
       ORDER BY orders.id DESC`,
      dateValues
    );
  } else if (req.params.type === "products") {
    columns = ["Product", "Units sold", "Revenue (₹)"];
    [rows] = await db.query(
      `SELECT products.name,
              COALESCE(SUM(CASE WHEN orders.id IS NOT NULL THEN order_items.quantity END), 0),
              COALESCE(SUM(CASE WHEN orders.id IS NOT NULL THEN order_items.quantity * order_items.price END), 0)
       FROM products
       LEFT JOIN order_items ON order_items.product_id = products.id
       LEFT JOIN orders ON orders.id = order_items.order_id AND ${counted} ${dateFilter}
       GROUP BY products.id, products.name
       ORDER BY 2 DESC`,
      dateValues
    );
  } else if (req.params.type === "customers") {
    columns = ["Customer", "Email", "Orders", "Spent (₹)"];
    [rows] = await db.query(
      `SELECT users.name, users.email, COUNT(orders.id), COALESCE(SUM(orders.total), 0)
       FROM users
       LEFT JOIN orders ON orders.user_id = users.id AND ${counted} ${dateFilter}
       WHERE users.role = 'customer'
       GROUP BY users.id
       ORDER BY 4 DESC`,
      dateValues
    );
  } else if (req.params.type === "inventory") {
    // No dates here: stock is "right now". Products with size/color rows show one line per row.
    columns = ["Product", "Size", "Color", "Stock"];
    [rows] = await db.query(
      `SELECT products.name, product_variants.size, product_variants.color, product_variants.stock
       FROM product_variants JOIN products ON products.id = product_variants.product_id
       UNION ALL
       SELECT products.name, products.size, products.color, products.stock
       FROM products
       WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.product_id = products.id)
       ORDER BY 1`
    );
  } else {
    return res.status(404).json({ message: "Unknown report" });
  }

  // The queries return rows as objects; the page wants plain lists of cells.
  // Numbers from SUM() arrive as text, so we turn numeric-looking text back into numbers.
  const table = rows.map((row) =>
    Object.values(row).map((cell) => (typeof cell === "string" && cell !== "" && !isNaN(cell) ? Number(cell) : cell))
  );
  res.json({ columns, rows: table });
});

module.exports = router;
