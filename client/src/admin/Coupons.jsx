// /admin/coupons -- discount codes customers type in the cart.
import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const emptyForm = { code: "", discount_percent: "", min_order: "0", max_uses: "", expires_at: "", active: "1" };

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = adding a new coupon
  const [error, setError] = useState("");

  function load() {
    api.get("/admin/coupons").then((response) => setCoupons(response.data));
  }
  useEffect(load, []);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discount_percent: String(coupon.discount_percent),
      min_order: String(coupon.min_order),
      max_uses: coupon.max_uses === null ? "" : String(coupon.max_uses),
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
      active: String(coupon.active),
    });
    setError("");
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/admin/coupons/${editingId}`, form);
      } else {
        await api.post("/admin/coupons", form);
      }
      reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    await api.delete(`/admin/coupons/${coupon.id}`);
    load();
  }

  return (
    <>
      <h1>Coupons</h1>

      <form className="adm-panel adm-form" onSubmit={save}>
        <h2 className="wide">{editingId ? "Edit coupon" : "Add coupon"}</h2>
        {error && <p className="adm-error wide">{error}</p>}
        <label>Code
          <input name="code" value={form.code} onChange={change} placeholder="SAVE10" required />
        </label>
        <label>Discount (%)
          <input name="discount_percent" type="number" min="1" max="90" value={form.discount_percent} onChange={change} required />
        </label>
        <label>Minimum order (₹)
          <input name="min_order" type="number" min="0" value={form.min_order} onChange={change} />
        </label>
        <label>Max uses
          <input name="max_uses" type="number" min="1" value={form.max_uses} onChange={change} placeholder="Unlimited" />
        </label>
        <label>Expires on
          <input name="expires_at" type="date" value={form.expires_at} onChange={change} />
        </label>
        <label>Status
          <select name="active" value={form.active} onChange={change}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </label>
        <div className="adm-form-actions">
          <button type="submit" className="adm-btn primary">{editingId ? "Save changes" : "Add coupon"}</button>
          {editingId && <button type="button" className="adm-btn" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.discount_percent}%</td>
                <td>₹{c.min_order}</td>
                <td>{c.used_count}{c.max_uses !== null && ` / ${c.max_uses}`}</td>
                <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-IN") : "Never"}</td>
                <td><span className={`adm-badge ${c.active ? "active" : "inactive"}`}>{c.active ? "active" : "inactive"}</span></td>
                <td>
                  <div className="adm-actions">
                    <button type="button" className="adm-btn" onClick={() => startEdit(c)}>Edit</button>
                    <button type="button" className="adm-btn danger" onClick={() => remove(c)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="adm-empty">No coupons yet.</p>}
      </div>
    </>
  );
}

export default Coupons;
