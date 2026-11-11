// Sign up and log in.
//   POST /api/auth/register   { name, email, password }
//   POST /api/auth/login      { email, password }
//   POST /api/auth/logout
//   GET  /api/auth/me         who is logged in right now
// The login token is sent as an HttpOnly cookie, so JavaScript on the page can never read it.
// The browser attaches the cookie to every request by itself.

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { loginRequired, COOKIE_NAME } = require("../middleware/auth");

const router = express.Router();

// On https (Render) the frontend and backend are on different sites, so the cookie needs
// SameSite=None + Secure. On http://localhost a plain Lax cookie works.
function cookieOptions(req) {
  return {
    httpOnly: true,
    secure: req.secure,
    sameSite: req.secure ? "none" : "lax",
    path: "/",
  };
}

function setLoginCookie(req, res, user) {
  res.cookie(COOKIE_NAME, makeToken(user), { ...cookieOptions(req), maxAge: 7 * 24 * 60 * 60 * 1000 });
}

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
  setLoginCookie(req, res, user);
  res.status(201).json({ user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];

  // Same message for "no such email" and "wrong password" -- don't help attackers.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Wrong email or password" });
  }

  setLoginCookie(req, res, user);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions(req));
  res.json({ message: "Logged out" });
});

// The page asks this on load to check the cookie is still valid.
router.get("/me", loginRequired, async (req, res) => {
  const [rows] = await db.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id]);
  if (rows.length === 0) return res.status(401).json({ message: "Please log in first" });
  res.json({ user: rows[0] });
});

module.exports = router;
