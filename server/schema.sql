-- Database structure for the store.
-- Run it with:  npm run setup   (see setup.js). Safe to run again any time.

CREATE DATABASE IF NOT EXISTS stylehub;
USE stylehub;

-- People who can log in. role is either 'customer' or 'admin'.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,          -- stored as a hash, never plain text
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Things we sell.
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,           -- Men / Women / Kids
  sub_category VARCHAR(80),                -- T-Shirts, Jeans ...
  brand VARCHAR(80),
  description TEXT,
  size VARCHAR(10),
  color VARCHAR(50),
  price INT NOT NULL,                      -- selling price in rupees (after discount)
  old_price INT,                           -- MRP (price before discount)
  discount INT NOT NULL DEFAULT 0,         -- percent
  rating DECIMAL(2,1) DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image VARCHAR(500),                      -- main picture
  images TEXT,                             -- all pictures, as a JSON list
  status VARCHAR(20) NOT NULL DEFAULT 'active',   -- active / inactive (inactive = hidden from shop)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lists the admin manages. The product form uses them for its drop-downs.
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  parent_id INT NULL,                      -- empty = main category, set = sub category
  parent_key INT AS (IFNULL(parent_id, 0)) STORED,
  UNIQUE (name, parent_key)                -- the same name is fine under different parents (Jeans in Men and Women)
);
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- Products a user has hearted.
CREATE TABLE IF NOT EXISTS wishlist (
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- One row per order placed.
-- status: placed -> confirmed -> shipped -> delivered   (or cancelled)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total INT NOT NULL,
  address TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'placed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- The items inside each order. Price is copied so old orders
-- keep their price even if the product price changes later.
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =====================================================
-- Phase 2 tables
-- =====================================================

-- Stock per size + color of a product (the Inventory page).
-- When a product has variants, products.stock is the total of its variants.
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, size, color),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Discount codes customers type in the cart.
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  discount_percent INT NOT NULL,           -- 10 = 10% off
  min_order INT NOT NULL DEFAULT 0,        -- smallest cart value allowed
  max_uses INT NULL,                       -- empty = unlimited
  used_count INT NOT NULL DEFAULT 0,
  expires_at DATE NULL,                    -- empty = never expires
  active TINYINT(1) NOT NULL DEFAULT 1
);

-- Homepage banners.
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(250),
  image VARCHAR(500),
  link VARCHAR(250),
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1
);

-- Customer reviews. status: visible / hidden (hidden by the admin).
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'visible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id),            -- one review per person per product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Return / refund requests. status: requested -> approved -> refunded  (or rejected)
CREATE TABLE IF NOT EXISTS returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'requested',
  refund_amount INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
