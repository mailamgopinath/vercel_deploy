// Sign up and log in.
//   POST /api/auth/register   { name, email, password }
//   POST /api/auth/login      { email, password }
// Both reply with a token. The frontend saves it and sends it with later requests.

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// Make a login token that lasts 7 days.
function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Is the email already used?
  const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    return res.status(409).json({ message: "This email is already registered" });
  }

  // Scramble the password so it is safe even if the database leaks.
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword]
  );

  const user = { id: result.insertId, name, email, role: "customer" };
  res.status(201).json({ token: makeToken(user), user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];

  // Same message for "no such email" and "wrong password" -- don't help attackers.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Wrong email or password" });
  }

  res.json({
    token: makeToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = router;
