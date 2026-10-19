// /orders -- the logged-in customer's orders. Delivered orders can be returned.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../AuthContext";
import api, { errorMessage } from "../api";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [returningId, setReturningId] = useState(null); // order whose return form is open
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    api.get("/orders").then((response) => setOrders(response.data));
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function requestReturn(orderId) {
    setMessage("");
    try {
      await api.post(`/orders/${orderId}/return`, { reason });
      setReturningId(null);
      setReason("");
      setMessage("Return requested. We'll update the status here.");
      load();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <>
      <Header />
      <main className="shopping-page">
        <div className="shopping-page-heading">
          <div>
            <p className="shopping-eyebrow">YOUR ACCOUNT</p>
            <h1>My orders</h1>
          </div>
          <Link to="/shop" className="shopping-back-link">Continue shopping <span aria-hidden="true">→</span></Link>
        </div>

        {!user ? (
          <section className="shopping-empty">
            <h2>Log in to see your orders</h2>
            <Link to="/login" className="shopping-primary-link">Log in</Link>
          </section>
        ) : orders.length === 0 ? (
          <section className="shopping-empty">
            <h2>No orders yet</h2>
            <Link to="/shop" className="shopping-primary-link">Start shopping</Link>
          </section>
        ) : (
          <div className="my-orders">
            {message && <p role="status">{message}</p>}
            {orders.map((order) => (
              <article className="my-order" key={order.id}>
                <div className="my-order-head">
                  <strong>Order #{order.id}</strong>
                  <span>{new Date(order.created_at).toLocaleDateString("en-IN")}</span>
                  <span className="my-order-status">{order.status}</span>
                  <strong>{rupees(order.total)}</strong>
                </div>

                {order.items.map((item, index) => (
                  <div className="my-order-item" key={index}>
                    {item.image && <img src={item.image} alt="" />}
                    <span>{item.name}</span>
                    <span>{item.quantity} × {rupees(item.price)}</span>
                  </div>
                ))}

                {/* Return area: only for delivered orders */}
                {order.return_status && <p className="my-order-note">Return: {order.return_status}</p>}
                {order.status === "delivered" && !order.return_status && returningId !== order.id && (
                  <button type="button" className="my-order-btn" onClick={() => { setReturningId(order.id); setMessage(""); }}>Return this order</button>
                )}
                {returningId === order.id && (
                  <div className="my-order-return">
                    <textarea rows={2} placeholder="Why do you want to return it?" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <button type="button" className="my-order-btn" onClick={() => requestReturn(order.id)}>Send request</button>
                    <button type="button" className="my-order-btn" onClick={() => setReturningId(null)}>Cancel</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default MyOrders;
