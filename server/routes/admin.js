// Everything the ADMIN PANEL needs. Only admins can use these routes.
//
//   GET    /api/admin/dashboard            numbers + chart data
//   GET    /api/admin/products             all products (including hidden ones)
//   POST   /api/admin/products             add a product
//   PUT    /api/admin/products/:id         edit a product
//   DELETE /api/admin/products/:id         delete a product
//   .../api/admin/categories | brands | sizes | colors     (list, add, edit, delete)
//   GET    /api/admin/orders               all orders
//   PUT    /api/admin/orders/:id/status    change an order's status
//   GET    /api/admin/customers            all customers

const express = require("express");
const db = require("../db");
const upload = require("../middleware/upload");
const { loginRequired, adminOnly } = require("../middleware/auth");
const { restoreStock } = require("../utils/products");

const router = express.Router();

// Every route in this file: must be logged in AND be an admin.
router.use(loginRequired, adminOnly);

// MySQL turns numbers like SUM() into text. This makes them real numbers.
const toNumber = (value) => Number(value) || 0;

// =====================================================
// DASHBOARD
// =====================================================
router.get("/dashboard", async (req, res) => {
  // "Cancelled" orders are left out of sales.
  const [[totals]] = await db.query(
    `SELECT
       COUNT(*) AS totalOrders,
       COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'returned', 'awaiting_payment') THEN total END), 0) AS totalSales,
       SUM(status = 'placed') AS pendingOrders,
       SUM(status = 'delivered') AS deliveredOrders
     FROM orders
     WHERE status <> 'awaiting_payment'`
  );
  const [[customers]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'");
  const [[products]] = await db.query("SELECT COUNT(*) AS count FROM products");

  // Last 6 months, one row per month.
  const [months] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
            COUNT(*) AS orders,
            SUM(total) AS sales
     FROM orders
     WHERE status NOT IN ('cancelled', 'returned', 'awaiting_payment') AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY month
     ORDER BY month`
  );

  const [topProducts] = await db.query(
    `SELECT products.id, products.name, SUM(order_items.quantity) AS sold
     FROM order_items
     JOIN orders ON orders.id = order_items.order_id
     JOIN products ON products.id = order_items.product_id
     WHERE orders.status NOT IN ('cancelled', 'returned', 'awaiting_payment')
     GROUP BY products.id, products.name
     ORDER BY sold DESC
     LIMIT 5`
  );

  res.json({
    totalOrders: toNumber(totals.totalOrders),
    totalSales: toNumber(totals.totalSales),
    pendingOrders: toNumber(totals.pendingOrders),
    deliveredOrders: toNumber(totals.deliveredOrders),
    totalCustomers: customers.count,
    totalProducts: products.count,
    byMonth: months.map((m) => ({ month: m.month, orders: toNumber(m.orders), sales: toNumber(m.sales) })),
    topProducts: topProducts.map((p) => ({ id: p.id, name: p.name, sold: toNumber(p.sold) })),
  });
});

// =====================================================
// PRODUCTS
// =====================================================

// Turn the form data into a clean product object, or return an error text.
// The admin types the MRP and the discount %; we work out the selling price.
function readProductForm(body) {
  if (!body.name || !body.category || !body.old_price) {
    return { error: "Name, category and price are required" };
  }

  const oldPrice = Number(body.old_price);
  const discount = Number(body.discount) || 0;

  if (!(oldPrice > 0)) return { error: "Price must be more than 0" };
  if (discount < 0 || discount > 90) return { error: "Discount must be between 0 and 90" };

  return {
    product: {
      name: body.name,
      category: body.category,
      sub_category: body.sub_category || null,
      brand: body.brand || null,
      description: body.description || null,
      size: body.size || null,
      color: body.color || null,
      old_price: oldPrice,
      discount,
      price: Math.round(oldPrice * (1 - discount / 100)),
      stock: Number(body.stock) || 0,
      status: body.status === "inactive" ? "inactive" : "active",
    },
  };
}

router.get("/products", async (req, res) => {
  const [products] = await db.query("SELECT * FROM products ORDER BY id DESC");
  res.json(products);
});

// Pictures come in a form field called "images" (up to 5).
router.post("/products", upload.array("images", 5), async (req, res) => {
  const { product, error } = readProductForm(req.body);
  if (error) return res.status(400).json({ message: error });

  // Uploaded files win; otherwise use an image web address if one was typed.
  const files = req.files.map((file) => `/uploads/${file.filename}`);
  const images = files.length > 0 ? files : req.body.image_url ? [req.body.image_url] : [];

  const [result] = await db.query(
    `INSERT INTO products
       (name, category, sub_category, brand, description, size, color,
        price, old_price, discount, stock, status, image, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [product.name, product.category, product.sub_category, product.brand, product.description,
     product.size, product.color, product.price, product.old_price, product.discount,
     product.stock, product.status, images[0] || null, JSON.stringify(images)]
  );

  res.status(201).json({ id: result.insertId, message: "Product added" });
});

router.put("/products/:id", upload.array("images", 5), async (req, res) => {
  const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: "Product not found" });

  const { product, error } = readProductForm(req.body);
  if (error) return res.status(400).json({ message: error });

  // New pictures replace the old ones. No new pictures = keep the old ones.
  let image = rows[0].image;
  let images = rows[0].images;
  const files = req.files.map((file) => `/uploads/${file.filename}`);
  if (files.length > 0) {
    image = files[0];
    images = JSON.stringify(files);
  } else if (req.body.image_url && req.body.image_url !== rows[0].image) {
    image = req.body.image_url;
    images = JSON.stringify([image]);
  }

  await db.query(
    `UPDATE products SET name=?, category=?, sub_category=?, brand=?, description=?,
       size=?, color=?, price=?, old_price=?, discount=?, stock=?, status=?, image=?, images=?
     WHERE id=?`,
    [product.name, product.category, product.sub_category, product.brand, product.description,
     product.size, product.color, product.price, product.old_price, product.discount,
     product.stock, product.status, image, images, req.params.id]
  );

  res.json({ message: "Product updated" });
});

router.delete("/products/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deleted" });
  } catch (error) {
    // A product that was already ordered must stay in the database,
    // because old orders point to it.
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "This product is in past orders, so it can't be deleted. Set its status to Inactive instead.",
      });
    }
    throw error;
  }
});

// =====================================================
// SIMPLE LISTS: categories, brands, sizes, colors
// They all work the same way, so we write the code once and reuse it.
// =====================================================
function addListRoutes(tableName, extraFields = []) {
  const fields = ["name", ...extraFields]; // columns the admin can set

  router.get(`/${tableName}`, async (req, res) => {
    const [rows] = await db.query(`SELECT * FROM ${tableName} ORDER BY id`);
    res.json(rows);
  });

  router.post(`/${tableName}`, async (req, res) => {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    const values = fields.map((field) => req.body[field] || null);
    try {
      const [result] = await db.query(
        `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`,
        values
      );
      res.status(201).json({ id: result.insertId });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "That name already exists" });
      }
      throw error;
    }
  });

  router.put(`/${tableName}/:id`, async (req, res) => {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    const setPart = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => req.body[field] || null);
    try {
      await db.query(`UPDATE ${tableName} SET ${setPart} WHERE id = ?`, [...values, req.params.id]);
      res.json({ message: "Updated" });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "That name already exists" });
      }
      throw error;
    }
  });

  router.delete(`/${tableName}/:id`, async (req, res) => {
    await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
    res.json({ message: "Deleted" });
  });
}

addListRoutes("categories", ["parent_id"]); // parent_id makes it a sub category
addListRoutes("brands");
addListRoutes("sizes");
addListRoutes("colors");

// =====================================================
// ORDERS
// =====================================================
const orderStatuses = ["placed", "confirmed", "shipped", "delivered", "cancelled", "returned"];

router.get("/orders", async (req, res) => {
  const [orders] = await db.query(
    `SELECT orders.*, users.name AS customer_name, users.email AS customer_email
     FROM orders
     JOIN users ON users.id = orders.user_id
     WHERE orders.status <> 'awaiting_payment'
     ORDER BY orders.created_at DESC`
  );

  // Attach the items to each order.
  for (const order of orders) {
    const [items] = await db.query(
      `SELECT order_items.quantity, order_items.price, products.name
       FROM order_items
       JOIN products ON products.id = order_items.product_id
       WHERE order_items.order_id = ?`,
      [order.id]
    );
    order.items = items;
  }
  res.json(orders);
});

// One order with everything the invoice needs.
router.get("/orders/:id", async (req, res) => {
  const [orders] = await db.query(
    `SELECT orders.*, users.name AS customer_name, users.email AS customer_email
     FROM orders JOIN users ON users.id = orders.user_id
     WHERE orders.id = ?`,
    [req.params.id]
  );
  if (orders.length === 0) return res.status(404).json({ message: "Order not found" });

  const [items] = await db.query(
    `SELECT order_items.quantity, order_items.price, order_items.size, order_items.color, products.name
     FROM order_items JOIN products ON products.id = order_items.product_id
     WHERE order_items.order_id = ?`,
    [req.params.id]
  );
  res.json({ ...orders[0], items });
});

router.put("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!orderStatuses.includes(status) || status === "returned") {
    return res.status(400).json({ message: "Unknown status" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [req.params.id]);
    const order = rows[0];
    if (!order) throw new Error("Order not found");

    if (order.status === "cancelled") throw new Error("A cancelled order can't be changed");
    if (order.status === "delivered" && status === "cancelled") {
      throw new Error("A delivered order can't be cancelled");
    }

    // Cancelling puts the items back into stock.
    if (status === "cancelled") {
      await restoreStock(order.id, connection);
    }

    await connection.query("UPDATE orders SET status = ? WHERE id = ?", [status, order.id]);
    await connection.commit();
    res.json({ message: "Order updated" });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// =====================================================
// CUSTOMERS
// =====================================================
router.get("/customers", async (req, res) => {
  const [customers] = await db.query(
    `SELECT users.id, users.name, users.email, users.created_at,
            COUNT(orders.id) AS order_count,
            COALESCE(SUM(CASE WHEN orders.status NOT IN ('cancelled', 'returned', 'awaiting_payment') THEN orders.total END), 0) AS total_spent
     FROM users
     LEFT JOIN orders ON orders.user_id = users.id
     WHERE users.role = 'customer'
     GROUP BY users.id
     ORDER BY users.created_at DESC`
  );
  res.json(customers.map((c) => ({ ...c, total_spent: toNumber(c.total_spent) })));
});

module.exports = router;
