// /admin/inventory -- stock for each size + color of a product.
// Example:  T-Shirt | M | Black | 25
import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const LOW_STOCK = 10; // rows below this number are highlighted

function Inventory() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [form, setForm] = useState({ product_id: "", size: "", color: "", stock: "" });
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.get("/admin/inventory").then((response) => setRows(response.data));
  }

  useEffect(() => {
    load();
    api.get("/admin/products").then((response) => setProducts(response.data));
    api.get("/admin/sizes").then((response) => setSizes(response.data));
    api.get("/admin/colors").then((response) => setColors(response.data));
  }, []);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function add(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/admin/inventory", form);
      setForm({ ...form, stock: "" });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function saveStock(row) {
    setError("");
    try {
      await api.put(`/admin/inventory/${row.id}`, { stock: editStock });
      setEditingId(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(row) {
    if (!window.confirm(`Remove ${row.product_name} (${row.size}, ${row.color})?`)) return;
    await api.delete(`/admin/inventory/${row.id}`);
    load();
  }

  return (
    <>
      <h1>Inventory</h1>

      <form className="adm-add-row" onSubmit={add}>
        <select name="product_id" value={form.product_id} onChange={change} required>
          <option value="">Product...</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="size" value={form.size} onChange={change} required>
          <option value="">Size...</option>
          {sizes.map((s) => <option key={s.id}>{s.name}</option>)}
        </select>
        <select name="color" value={form.color} onChange={change} required>
          <option value="">Color...</option>
          {colors.map((c) => <option key={c.id}>{c.name}</option>)}
        </select>
        <input name="stock" type="number" min="0" placeholder="Stock" value={form.stock} onChange={change} required />
        <button type="submit" className="adm-btn primary">Add / update</button>
      </form>
      <p className="adm-note">
        Adding a size + color that already exists updates its stock. A product's total stock is the sum of its rows.
      </p>
      {error && <p className="adm-error">{error}</p>}

      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Product</th><th>Size</th><th>Color</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.product_name}</td>
                <td>{row.size}</td>
                <td>{row.color}</td>
                <td>
                  {editingId === row.id ? (
                    <input className="adm-inline-input" type="number" min="0" style={{ width: 90 }} value={editStock} onChange={(e) => setEditStock(e.target.value)} />
                  ) : (
                    <>
                      {row.stock}
                      {row.stock < LOW_STOCK && <span className="adm-badge cancelled" style={{ marginLeft: 8 }}>low</span>}
                    </>
                  )}
                </td>
                <td>
                  <div className="adm-actions">
                    {editingId === row.id ? (
                      <>
                        <button type="button" className="adm-btn primary" onClick={() => saveStock(row)}>Save</button>
                        <button type="button" className="adm-btn" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="adm-btn" onClick={() => { setEditingId(row.id); setEditStock(String(row.stock)); }}>Edit</button>
                        <button type="button" className="adm-btn danger" onClick={() => remove(row)}>Remove</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="adm-empty">No size/color stock added yet. Products without rows use the single stock number from the Products page.</p>}
      </div>
    </>
  );
}

export default Inventory;
