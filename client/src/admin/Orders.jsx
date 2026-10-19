// /admin/orders -- see every order, confirm it, move it along, or cancel it.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// For each status: which buttons to show. [label, status to set]
const nextSteps = {
  placed: [["Confirm", "confirmed"]],
  confirmed: [["Mark shipped", "shipped"]],
  shipped: [["Mark delivered", "delivered"]],
  delivered: [],
  cancelled: [],
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  function load() {
    api.get("/admin/orders").then((response) => setOrders(response.data));
  }
  useEffect(load, []);

  async function setStatus(order, status) {
    if (status === "cancelled" && !window.confirm(`Cancel order #${order.id}? Stock will be returned.`)) return;
    setError("");
    try {
      await api.put(`/admin/orders/${order.id}/status`, { status });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <div className="adm-top">
        <h1>Orders</h1>
        <select className="adm-inline-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All orders</option>
          {["placed", "confirmed", "shipped", "delivered", "cancelled", "returned"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && <p className="adm-error">{error}</p>}

      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {shown.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  {order.customer_name}
                  <div className="adm-note">{order.customer_email}</div>
                  <div className="adm-note">{order.address}</div>
                </td>
                <td>{order.items.map((item) => <div key={item.name}>{item.quantity} × {item.name}</div>)}</td>
                <td>{rupees(order.total)}</td>
                <td>{order.payment_method === "razorpay" ? "Online" : "Cash on delivery"}<div className="adm-note">{order.payment_status}</div></td>
                <td>{new Date(order.created_at).toLocaleDateString("en-IN")}</td>
                <td><span className={`adm-badge ${order.status}`}>{order.status}</span></td>
                <td>
                  <div className="adm-actions">
                    <Link to={`/admin/orders/${order.id}/invoice`} className="adm-btn">Invoice</Link>
                    {nextSteps[order.status].map(([label, status]) => (
                      <button key={status} type="button" className="adm-btn primary" onClick={() => setStatus(order, status)}>{label}</button>
                    ))}
                    {(order.status === "placed" || order.status === "confirmed" || order.status === "shipped") && (
                      <button type="button" className="adm-btn danger" onClick={() => setStatus(order, "cancelled")}>Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="adm-empty">No orders.</p>}
      </div>
    </>
  );
}

export default Orders;
