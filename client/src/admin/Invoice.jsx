// /admin/orders/:id/invoice -- a printable invoice. Click "Print" to print or save as PDF.
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function Invoice() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/admin/orders/${id}`)
      .then((response) => setOrder(response.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) return <p className="adm-error">{error}</p>;
  if (!order) return <p>Loading...</p>;

  return (
    <>
      <div className="adm-top adm-no-print">
        <Link to="/admin/orders" className="adm-btn">← Back to orders</Link>
        <button type="button" className="adm-btn primary" onClick={() => window.print()}>Print / save as PDF</button>
      </div>

      <div className="adm-panel adm-invoice">
        <div className="adm-top">
          <div>
            <h1>INVOICE</h1>
            <p className="adm-note">StyleHub</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>Invoice #{order.id}</strong>
            <p className="adm-note">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
            <span className={`adm-badge ${order.status}`}>{order.status}</span>
          </div>
        </div>

        <p><strong>Bill to</strong><br />{order.customer_name}<br />{order.customer_email}<br />{order.address}</p>

        <table className="adm-table">
          <thead>
            <tr><th>Item</th><th>Size / Color</th><th>Price</th><th>Qty</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{[item.size, item.color].filter(Boolean).join(" / ") || "-"}</td>
                <td>{rupees(item.price)}</td>
                <td>{item.quantity}</td>
                <td>{rupees(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="adm-invoice-totals">
          <div><span>Subtotal</span><span>{rupees(order.subtotal)}</span></div>
          {order.discount > 0 && <div><span>Discount ({order.coupon_code})</span><span>−{rupees(order.discount)}</span></div>}
          <div><span>Delivery</span><span>{order.delivery === 0 ? "Free" : rupees(order.delivery)}</span></div>
          <div className="total"><span>Total</span><span>{rupees(order.total)}</span></div>
        </div>
      </div>
    </>
  );
}

export default Invoice;
