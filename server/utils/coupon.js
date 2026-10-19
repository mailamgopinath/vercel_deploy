// Decides whether a coupon can be used for a cart worth "subtotal" rupees.
// Returns an error message, or null when the coupon is fine.

function couponProblem(coupon, subtotal) {
  if (!coupon || !coupon.active) return "That code is not valid";

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date(new Date().toDateString())) {
    return "That code has expired";
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return "That code has been used up";
  }
  if (subtotal < coupon.min_order) {
    return `This code needs an order of at least ₹${coupon.min_order}`;
  }
  return null;
}

module.exports = { couponProblem };
