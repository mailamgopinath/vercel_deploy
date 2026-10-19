// /admin/reviews -- hide or delete customer reviews.
import React, { useEffect, useState } from "react";
import api from "../api";

function Reviews() {
  const [reviews, setReviews] = useState([]);

  function load() {
    api.get("/admin/reviews").then((response) => setReviews(response.data));
  }
  useEffect(load, []);

  async function setStatus(review, status) {
    await api.put(`/admin/reviews/${review.id}`, { status });
    load();
  }

  async function remove(review) {
    if (!window.confirm("Delete this review?")) return;
    await api.delete(`/admin/reviews/${review.id}`);
    load();
  }

  return (
    <>
      <h1>Reviews</h1>
      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>{r.product_name}</td>
                <td>{r.user_name}</td>
                <td>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                <td>{r.comment}</td>
                <td>{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                <td><span className={`adm-badge ${r.status === "visible" ? "active" : "inactive"}`}>{r.status}</span></td>
                <td>
                  <div className="adm-actions">
                    {r.status === "visible"
                      ? <button type="button" className="adm-btn" onClick={() => setStatus(r, "hidden")}>Hide</button>
                      : <button type="button" className="adm-btn" onClick={() => setStatus(r, "visible")}>Show</button>}
                    <button type="button" className="adm-btn danger" onClick={() => remove(r)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <p className="adm-empty">No reviews yet.</p>}
      </div>
    </>
  );
}

export default Reviews;
