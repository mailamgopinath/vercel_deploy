// Run with:  npm run setup
// It creates the database + tables, upgrades older tables, adds sample data,
// and makes an admin user. Safe to run many times -- it never deletes anything.

require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=82`;

// name, category, brand, size, color, price, old_price, rating, stock, image
const sampleProducts = [
  ["Classic Black T-Shirt", "Men", "Urban Style", "M", "Black", 799, 999, 4.5, 50, img("photo-1521572163474-6864f9cf17ab")],
  ["Premium Denim Jeans", "Men", "Denim Co", "L", "Blue", 1499, 1999, 4.7, 40, img("photo-1542272604-787c3835535d")],
  ["Casual Cotton Shirt", "Men", "Fashion Hub", "M", "White", 999, 1299, 4.3, 30, img("photo-1596755094514-f87e34085b2c")],
  ["Women's Summer Dress", "Women", "Style House", "S", "Red", 1299, 1799, 4.8, 25, img("photo-1496747611176-843222e1e57c")],
  ["Oversized Hoodie", "Men", "Urban Style", "XL", "Black", 1199, 1599, 4.4, 35, img("photo-1556821840-3a63f95609a7")],
  ["Women's Casual Top", "Women", "Fashion Hub", "M", "Pink", 699, 899, 4.2, 60, img("photo-1551163943-3f6a855d1153")],
  ["Kids Casual T-Shirt", "Kids", "Kids World", "S", "Yellow", 499, 699, 4.6, 45, img("photo-1519238263530-99bdd11df2ea")],
  ["Slim Fit Trousers", "Men", "Denim Co", "L", "Grey", 1099, 1499, 4.1, 20, img("photo-1473966968600-fa801b869a1a")],
];

// Columns added after the first version: [table, column, definition].
// If your tables were created earlier, these get added to them now.
const newColumns = [
  ["products", "sub_category", "VARCHAR(80)"],
  ["products", "description", "TEXT"],
  ["products", "discount", "INT NOT NULL DEFAULT 0"],
  ["products", "images", "TEXT"],
  ["products", "status", "VARCHAR(20) NOT NULL DEFAULT 'active'"],
  ["orders", "subtotal", "INT NOT NULL DEFAULT 0"],
  ["orders", "discount", "INT NOT NULL DEFAULT 0"],
  ["orders", "delivery", "INT NOT NULL DEFAULT 0"],
  ["orders", "coupon_code", "VARCHAR(30)"],
  ["orders", "payment_method", "VARCHAR(20) NOT NULL DEFAULT 'cod'"],     // cod / razorpay
  ["orders", "payment_status", "VARCHAR(20) NOT NULL DEFAULT 'pending'"], // pending / paid / failed
  ["orders", "razorpay_order_id", "VARCHAR(60)"],
  ["orders", "razorpay_payment_id", "VARCHAR(60)"],
  ["order_items", "size", "VARCHAR(10)"],
  ["order_items", "color", "VARCHAR(50)"],
];

// Add a column only if the table doesn't have it yet.
async function addColumnIfMissing(connection, table, column, definition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, table, column]
  );
  if (rows[0].count === 0) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${table}.${column}`);
  }
}

// Older databases required every category name to be unique. Switch them to
// "unique within the same parent", so "Jeans" can be a sub category of Men AND Women.
async function upgradeCategoriesTable(connection) {
  const [oldIndex] = await connection.query(
    `SELECT COUNT(*) AS count FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND INDEX_NAME = 'name'`,
    [process.env.DB_NAME]
  );
  if (oldIndex[0].count > 0) {
    await connection.query("ALTER TABLE categories DROP INDEX name");
    await addColumnIfMissing(connection, "categories", "parent_key", "INT AS (IFNULL(parent_id, 0)) STORED");
    await connection.query("ALTER TABLE categories ADD UNIQUE (name, parent_key)");
    console.log("categories table upgraded");
  }
}

// Sub categories used by the Men / Women / Kids pages.
const subCategories = {
  Men: ["T-Shirts", "Shirts", "Jeans", "Trousers", "Jackets", "Hoodies"],
  Women: ["Dresses", "Tops", "Jeans", "Sarees", "Kurtis", "Jackets"],
  Kids: ["Boys", "Girls", "T-Shirts", "Dresses", "Jeans"],
};

// Word in a product name -> its sub category.
const nameHints = [
  ["t-shirt", "T-Shirts"], ["shirt", "Shirts"], ["jeans", "Jeans"], ["trouser", "Trousers"],
  ["hoodie", "Hoodies"], ["dress", "Dresses"], ["top", "Tops"], ["jacket", "Jackets"],
];

async function seedSubCategories(connection) {
  const [existing] = await connection.query("SELECT COUNT(*) AS count FROM categories WHERE parent_id IS NOT NULL");
  if (existing[0].count > 0) return;

  for (const [mainName, subNames] of Object.entries(subCategories)) {
    const [[main]] = await connection.query("SELECT id FROM categories WHERE name = ? AND parent_id IS NULL", [mainName]);
    if (!main) continue;
    await connection.query("INSERT INTO categories (name, parent_id) VALUES ?", [subNames.map((name) => [name, main.id])]);
  }

  // Give existing products without a sub category a sensible one.
  for (const [word, sub] of nameHints) {
    await connection.query(
      "UPDATE products SET sub_category = ? WHERE sub_category IS NULL AND LOWER(name) LIKE ?",
      [sub, `%${word}%`]
    );
  }
  console.log("Sub categories added");
}

// Fill a small list table with starter values if it is empty.
async function seedList(connection, table, names) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM ${table}`);
  if (rows[0].count === 0) {
    await connection.query(`INSERT INTO ${table} (name) VALUES ?`, [names.map((name) => [name])]);
    console.log(`${table} filled`);
  }
}

async function setup() {
  // Connect WITHOUT choosing a database first, because it may not exist yet.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true, // lets us run the whole schema.sql file at once
  });

  // 1. Create the database and tables.
  await connection.query(fs.readFileSync("schema.sql", "utf8"));
  console.log("Tables ready");

  // 2. Upgrade older tables.
  for (const [table, column, definition] of newColumns) {
    await addColumnIfMissing(connection, table, column, definition);
  }
  // Older orders didn't store a subtotal; the total is the best guess.
  await connection.query("UPDATE orders SET subtotal = total WHERE subtotal = 0");
  // Older products only had old_price/price; work out their discount percent.
  await connection.query(
    "UPDATE products SET discount = ROUND((old_price - price) * 100 / old_price) WHERE discount = 0 AND old_price > price"
  );

  // 3. Add sample products, but only if there are none yet.
  const [existing] = await connection.query("SELECT COUNT(*) AS count FROM products");
  if (existing[0].count === 0) {
    await connection.query(
      `INSERT INTO products (name, category, brand, size, color, price, old_price, rating, stock, image)
       VALUES ?`,
      [sampleProducts]
    );
    await connection.query(
      "UPDATE products SET discount = ROUND((old_price - price) * 100 / old_price)"
    );
    console.log("Sample products added");
  }

  // 4. Starter lists for the admin drop-downs.
  await seedList(connection, "categories", ["Men", "Women", "Kids"]);
  await upgradeCategoriesTable(connection);
  await seedList(connection, "brands", ["Urban Style", "Denim Co", "Fashion Hub", "Style House", "Kids World"]);
  await seedSubCategories(connection);
  await seedList(connection, "sizes", ["XS", "S", "M", "L", "XL", "XXL"]);
  await seedList(connection, "colors", ["Black", "White", "Blue", "Red", "Pink", "Yellow", "Grey"]);

  // Starter coupon (this used to be hard-coded in the cart page).
  await connection.query(
    "INSERT IGNORE INTO coupons (code, discount_percent, min_order) VALUES ('SAVE10', 10, 0)"
  );

  // 5. Create the admin user, if missing.
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await connection.query(
    "INSERT IGNORE INTO users (name, email, password, role) VALUES ('Admin', ?, ?, 'admin')",
    [process.env.ADMIN_EMAIL, hashedPassword]
  );
  console.log(`Admin ready: ${process.env.ADMIN_EMAIL}`);

  await connection.end();
}

setup().catch((error) => {
  console.error("Setup failed:", error.message);
  process.exit(1);
});
