import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useCart } from "../CartContext";
import { useAuth } from "../AuthContext";
import api, { errorMessage, fetchProducts } from "../api";
import { loadRazorpay } from "../razorpay";

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponPercent, setCouponPercent] = useState(0);   // 0 = no coupon applied
  const [appliedCode, setAppliedCode] = useState("");
  const couponApplied = appliedCode !== "";
  const [couponMessage, setCouponMessage] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");  // "razorpay" (online) or "cod" (cash on delivery)
  const [onlineEnabled, setOnlineEnabled] = useState(false);   // does the server have Razorpay keys?
  const [paying, setPaying] = useState(false);                 // true while an order is being placed

  // Ask the server whether online payment is switched on, and choose it by default if so.
  useEffect(() => {
    api.get("/payments/config")
      .then((response) => {
        setOnlineEnabled(response.data.enabled);
        if (response.data.enabled) setPaymentMethod("razorpay");
      })
      .catch(() => {});
  }, []);

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const couponDiscount = Math.round((subtotal * couponPercent) / 100);
  const deliveryCharge = subtotal >= 999 || subtotal === 0 ? 0 : 80;
  const totalAmount = subtotal - couponDiscount + deliveryCharge;

  // Ask the server if the code is good (the admin manages codes on the Coupons page).
  async function applyCoupon(event) {
    event.preventDefault();
    try {
      const response = await api.post("/coupons/validate", { code: coupon, subtotal });
      setAppliedCode(response.data.code);
      setCouponPercent(response.data.percent);
      setCouponMessage(`${response.data.code} applied. You saved ${response.data.percent}% on your order.`);
    } catch (error) {
      setAppliedCode("");
      setCouponPercent(0);
      setCouponMessage(errorMessage(error));
    }
  }

  // Match each bag item to the store's product by NAME to get its real database id
  // (some product pages use their own ids). Returns the list, or null if something is unavailable.
  async function buildOrderItems() {
    const storeProducts = await fetchProducts();
    const items = [];
    for (const item of cartItems) {
      const match = storeProducts.find((product) => product.name === item.name);
      if (!match) {
        setCheckoutMessage(`"${item.name}" is not available right now. Please remove it.`);
        return null;
      }
      items.push({ productId: match.id, quantity: item.quantity, size: item.size, color: item.color });
    }
    return items;
  }

  // Pay online with Razorpay:
  //   1. the server saves the order and asks Razorpay for a payment order
  //   2. we open Razorpay's payment window
  //   3. after paying, the server checks the payment is genuine before confirming the order
  async function payOnline(orderDetails) {
    await loadRazorpay();
    const { data: order } = await api.post("/payments/create-order", orderDetails);

    // This promise finishes when the payment window is done (paid, closed, or failed).
    await new Promise((resolve) => {
      let finished = false;

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "StyleHub",
        description: `Order #${order.orderId}`,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#244f3c" },

        // The customer paid.
        handler: async (response) => {
          finished = true;
          try {
            await api.post("/payments/verify", { orderId: order.orderId, ...response });
            clearCart();
            navigate("/orders");
          } catch (error) {
            setCheckoutMessage(errorMessage(error));
          }
          resolve();
        },

        // The customer closed the window without paying.
        modal: {
          ondismiss: async () => {
            if (finished) return;
            finished = true;
            try {
              const { data } = await api.post("/payments/cancel", { orderId: order.orderId });
              if (data.paid) {
                clearCart(); // they did pay just before closing
                navigate("/orders");
              } else {
                setCheckoutMessage("Payment was cancelled. Your bag is saved, so you can try again.");
              }
            } catch (error) {
              setCheckoutMessage(errorMessage(error));
            }
            resolve();
          },
        },
      });

      // A failed attempt (wrong OTP, card declined...). The customer can retry inside the window.
      checkout.on("payment.failed", (response) => {
        setCheckoutMessage(`Payment failed: ${response.error.description}. You can try again.`);
      });

      checkout.open();
    });
  }

  // The "Place order" button.
  async function placeOrder() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!address.trim()) {
      setCheckoutMessage("Please enter your delivery address.");
      return;
    }

    setPaying(true);
    setCheckoutMessage("");
    try {
      const items = await buildOrderItems();
      if (!items) return;

      const orderDetails = { address, items, coupon: appliedCode };

      if (paymentMethod === "razorpay") {
        await payOnline(orderDetails);
      } else {
        // Cash on delivery: the order is placed straight away.
        await api.post("/orders", orderDetails);
        clearCart();
        navigate("/orders"); // the "My orders" page shows the new order
      }
    } catch (error) {
      setCheckoutMessage(errorMessage(error));
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      <Header />
      <main className="shopping-page cart-page">
        <div className="shopping-page-heading">
          <div>
            <p className="shopping-eyebrow">YOUR BAG</p>
            <h1>Shopping bag</h1>
            <p className="shopping-intro">
              {itemCount ? `${itemCount} ${itemCount === 1 ? "item" : "items"} ready when you are.` : "Your next favorite might be just around the corner."}
            </p>
          </div>
          <Link to="/shop" className="shopping-back-link">Continue shopping <span aria-hidden="true">→</span></Link>
        </div>

        {cartItems.length === 0 ? (
          <section className="shopping-empty">
            <span className="shopping-empty-mark" aria-hidden="true">＋</span>
            <h2>Your bag is taking a little break</h2>
            <p>Explore the collection and add something you love.</p>
            <Link to="/shop" className="shopping-primary-link">Explore the shop</Link>
          </section>
        ) : (
          <>
            <div className={`cart-delivery-note${subtotal >= 999 ? " is-unlocked" : ""}`} role="status">
              <span className="delivery-note-icon" aria-hidden="true">{subtotal >= 999 ? "✓" : "↗"}</span>
              <span>{subtotal >= 999 ? "Complimentary delivery is on us." : `Add ₹${(999 - subtotal).toLocaleString("en-IN")} more for complimentary delivery.`}</span>
              <span className="delivery-note-threshold">₹999+</span>
            </div>

            <div className="cart-layout">
              <section className="cart-items-panel" aria-label="Items in your shopping bag">
                <div className="cart-panel-heading">
                  <h2>Your items</h2>
                  <span>{cartItems.length} {cartItems.length === 1 ? "product" : "products"}</span>
                </div>
                <div className="cart-item-list">
                  {cartItems.map((item) => (
                    <article className="cart-item" key={item.lineId}>
                      <Link to={`/product/${item.id}`} className="cart-product-image">
                        <img src={item.image} alt={item.name} />
                      </Link>
                      <div className="cart-product-info">
                        <p className="cart-item-label">STYLEHUB ESSENTIALS</p>
                        <Link to={`/product/${item.id}`} className="cart-product-name">{item.name}</Link>
                        <p className="cart-product-variant">{item.color} <span aria-hidden="true">·</span> Size {item.size}</p>
                        <div className="cart-item-controls">
                          <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                            <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity === 1} onClick={() => updateQuantity(item.lineId, -1)}>−</button>
                            <span aria-live="polite">{item.quantity}</span>
                            <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQuantity(item.lineId, 1)}>+</button>
                          </div>
                          <button type="button" className="cart-remove" onClick={() => removeFromCart(item.lineId)}>Remove</button>
                        </div>
                      </div>
                      <strong className="cart-line-price">₹{(item.price * item.quantity).toLocaleString("en-IN")}</strong>
                    </article>
                  ))}
                </div>
                <Link to="/shop" className="cart-continue-link"><span aria-hidden="true">←</span> Keep browsing</Link>
              </section>

              <aside className="cart-summary" aria-labelledby="cart-summary-title">
                <h2 id="cart-summary-title">Order summary</h2>
                <form className="coupon-section" onSubmit={applyCoupon}>
                  <label htmlFor="coupon-code">Have a promo code?</label>
                  <div className="coupon-input">
                    <input id="coupon-code" type="text" value={coupon} onChange={(event) => { setCoupon(event.target.value); setCouponMessage(""); }} placeholder="Enter code" />
                    <button type="submit">Apply</button>
                  </div>
                  <p className={`coupon-message${couponApplied ? " is-success" : ""}`} aria-live="polite">{couponMessage || "Have a promo code? Enter it above."}</p>
                </form>
                <div className="summary-details">
                  <div className="summary-row"><span>Subtotal</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div>
                  {couponApplied && <div className="summary-row discount-row"><span>Promo savings</span><strong>−₹{couponDiscount.toLocaleString("en-IN")}</strong></div>}
                  <div className="summary-row"><span>Delivery</span><strong>{deliveryCharge === 0 ? "Complimentary" : `₹${deliveryCharge}`}</strong></div>
                </div>
                <div className="summary-total"><span>Total <small>Inclusive of taxes</small></span><strong>₹{totalAmount.toLocaleString("en-IN")}</strong></div>
                <textarea className="checkout-address" placeholder="Delivery address" value={address} onChange={(event) => setAddress(event.target.value)} rows={3} />
                <fieldset className="payment-options">
                  <legend>Payment method</legend>
                  {onlineEnabled && (
                    <label className={paymentMethod === "razorpay" ? "is-selected" : ""}>
                      <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} />
                      <span><strong>Pay online</strong><small>UPI, cards, netbanking and wallets</small></span>
                    </label>
                  )}
                  <label className={paymentMethod === "cod" ? "is-selected" : ""}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                    <span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span>
                  </label>
                </fieldset>
                <button type="button" className="checkout-btn" onClick={placeOrder} disabled={paying}>
                  {!user ? "Log in to checkout" : paying ? "Please wait..." : paymentMethod === "razorpay" ? `Pay ₹${totalAmount.toLocaleString("en-IN")}` : "Place order"} <span aria-hidden="true">→</span>
                </button>
                <p className="checkout-message" role="status">{checkoutMessage}</p>
                <p className="secure-payment"><span aria-hidden="true">◇</span> Secure checkout · Easy 14-day returns</p>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export default Cart;
