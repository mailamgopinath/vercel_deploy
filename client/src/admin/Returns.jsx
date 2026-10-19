// /admin/returns -- customers asking to return a delivered order.
// requested -> approved -> refunded   (or rejected)
import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// For each status: the buttons to show. [label, new status]
const nextSteps = {
  requested: [["Approve", "approved"], ["Reject", "rejected"]],
  approved: [["Mark refunded", "refunded"]],
  rejected: [],
  refunded: [],
};

function Returns() {
  const [returns, setReturns] = useState([]);
  const [error, setError] = useState("");

  function load() {
    api.get("/admin/returns").then((response) => setReturns(response.data));
  }
  useEffect(load, []);

  async function setStatus(item, status) {
    if (status === "refunded" && !window.confirm(
      `Mark ${rupees(item.order_total)} as refunded? The items go back into stock. (Send the money back to the customer yourself.)`
    )) return;

    setError("");
    try {
      await api.put(`/admin/returns/${item.id}`, { status });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <h1>Returns &amp; refunds</h1>
      {error && <p className="adm-error">{error}</p>}
      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Order #</th><th>Customer</th><th>Reason</th><th>Order total</th><th>Requested</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {returns.map((item) => (
              <tr key={item.id}>
                <td>{item.order_id}</td>
                <td>{item.customer_name}<div className="adm-note">{item.customer_email}</div></td>
                <td>{item.reason}</td>
                <td>{rupees(item.order_total)}</td>
                <td>{new Date(item.created_at).toLocaleDateString("en-IN")}</td>
                <td><span className={`adm-badge ${item.status === "rejected" ? "cancelled" : item.status === "refunded" ? "delivered" : "placed"}`}>{item.status}</span></td>
                <td>
                  <div className="adm-actions">
                    {nextSteps[item.status].map(([label, status]) => (
                      <button key={status} type="button" className={`adm-btn ${status === "rejected" ? "danger" : "primary"}`} onClick={() => setStatus(item, status)}>{label}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {returns.length === 0 && <p className="adm-empty">No return requests.</p>}
      </div>
    </>
  );
}

export default Returns;
