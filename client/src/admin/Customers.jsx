// /admin/customers -- everyone who has signed up.
import React, { useEffect, useState } from "react";
import api from "../api";

function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    api.get("/admin/customers").then((response) => setCustomers(response.data));
  }, []);

  return (
    <>
      <h1>Customers</h1>
      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Joined</th><th>Orders</th><th>Total spent</th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                <td>{c.order_count}</td>
                <td>₹{c.total_spent.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="adm-empty">No customers yet.</p>}
      </div>
    </>
  );
}

export default Customers;
