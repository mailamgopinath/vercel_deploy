// Connects to MySQL. Other files do:  const db = require("./db");
// then run queries like:  const [rows] = await db.query("SELECT ...", [values]);

require("dotenv").config(); // loads values from the .env file
const mysql = require("mysql2/promise");

// A "pool" keeps a few connections open and reuses them (faster than reconnecting).
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Aiven requires an encrypted (SSL) connection.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

module.exports = db;
