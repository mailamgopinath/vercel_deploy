// "Middleware" is a function that runs BEFORE a route.
// These two decide whether the visitor is allowed to continue.

const jwt = require("jsonwebtoken");

// 1. loginRequired: the visitor must send a valid login token.
//    The frontend sends it in a header:  Authorization: Bearer <token>
function loginRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Please log in first" });
  }

  try {
    // If the token is fake or expired, verify() throws an error.
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // { id, role } -- now available inside the route
    next();          // go on to the route
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// 2. adminOnly: use AFTER loginRequired. Only admins may continue.
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}

module.exports = { loginRequired, adminOnly };
