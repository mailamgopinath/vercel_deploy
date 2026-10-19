// /admin/products -- list, add, edit, view and delete products.
import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// What the form looks like when empty.
const emptyForm = {
  name: "", category: "", sub_category: "", brand: "", description: "",
  old_price: "", discount: "0", stock: "", size: "", color: "", status: "active", image_url: "",
};

function Products() {
  const [products, setProducts] = useState([]);
  const [lists, setLists] = useState({ categories: [], brands: [], sizes: [], colors: [] });
  const [form, setForm] = useState(null);         // null = form hidden
  const [editingId, setEditingId] = useState(null); // null = adding a new product
  const [files, setFiles] = useState([]);         // pictures chosen in the form
  const [viewing, setViewing] = useState(null);   // product shown in the "view" box
  const [error, setError] = useState("");

  // Load products + the drop-down lists when the page opens.
  useEffect(() => {
    loadProducts();
    for (const name of ["categories", "brands", "sizes", "colors"]) {
      api.get(`/admin/${name}`).then((response) => {
        setLists((current) => ({ ...current, [name]: response.data }));
      });
    }
  }, []);

  function loadProducts() {
    api.get("/admin/products").then((response) => setProducts(response.data));
  }

  // Update one field of the form.
  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setError("");
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category || "",
      sub_category: product.sub_category || "",
      brand: product.brand || "",
      description: product.description || "",
      old_price: String(product.old_price || product.price),
      discount: String(product.discount || 0),
      stock: String(product.stock),
      size: product.size || "",
      color: product.color || "",
      status: product.status,
      image_url: product.image || "",
    });
    setFiles([]);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event) {
    event.preventDefault();
    setError("");

    // Pictures need "FormData" (a form that can carry files).
    const data = new FormData();
    for (const key in form) data.append(key, form[key]);
    for (const file of files) data.append("images", file);

    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, data);
      } else {
        await api.post("/admin/products", data);
      }
      setForm(null);
      loadProducts();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.delete(`/admin/products/${product.id}`);
      loadProducts();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  // The selling price shown live while typing.
  const sellingPrice = form
    ? Math.round(Number(form.old_price || 0) * (1 - Number(form.discount || 0) / 100))
    : 0;

  // Sub categories of the chosen category.
  const mainCategory = lists.categories.find((c) => c.name === form?.category);
  const subCategories = lists.categories.filter((c) => mainCategory && c.parent_id === mainCategory.id);

  return (
    <>
      <div className="adm-top">
        <h1>Products</h1>
        <button type="button" className="adm-btn primary" onClick={openAdd}>+ Add product</button>
      </div>

      {/* ---------- add / edit form ---------- */}
      {form && (
        <form className="adm-panel adm-form" onSubmit={save}>
          <h2 className="wide">{editingId ? "Edit product" : "Add product"}</h2>
          {error && <p className="adm-error wide">{error}</p>}

          <label>Product name
            <input name="name" value={form.name} onChange={change} required />
          </label>
          <label>Category
            <select name="category" value={form.category} onChange={change} required>
              <option value="">Select...</option>
              {lists.categories.filter((c) => !c.parent_id).map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Sub category
            <select name="sub_category" value={form.sub_category} onChange={change}>
              <option value="">None</option>
              {subCategories.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Brand
            <select name="brand" value={form.brand} onChange={change}>
              <option value="">None</option>
              {lists.brands.map((b) => <option key={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label>Price (MRP, ₹)
            <input name="old_price" type="number" min="1" value={form.old_price} onChange={change} required />
          </label>
          <label>Discount (%)
            <input name="discount" type="number" min="0" max="90" value={form.discount} onChange={change} />
            <span className="adm-note">Customers pay {rupees(sellingPrice)}</span>
          </label>
          <label>Stock
            <input name="stock" type="number" min="0" value={form.stock} onChange={change} required />
          </label>
          <label>Size
            <select name="size" value={form.size} onChange={change}>
              <option value="">None</option>
              {lists.sizes.map((s) => <option key={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>Color
            <select name="color" value={form.color} onChange={change}>
              <option value="">None</option>
              {lists.colors.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Status
            <select name="status" value={form.status} onChange={change}>
              <option value="active">Active (shown in shop)</option>
              <option value="inactive">Inactive (hidden)</option>
            </select>
          </label>
          <label className="wide">Description
            <textarea name="description" rows={3} value={form.description} onChange={change} />
          </label>
          <label>Images (up to 5)
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 5))} />
            <span className="adm-note">{files.length ? `${files.length} file(s) chosen` : "Leave empty to keep the current image"}</span>
          </label>
          <label>...or image web address
            <input name="image_url" value={form.image_url} onChange={change} placeholder="https://..." />
          </label>

          <div className="adm-form-actions">
            <button type="submit" className="adm-btn primary">Save</button>
            <button type="button" className="adm-btn" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      {/* ---------- view box ---------- */}
      {viewing && (
        <div className="adm-panel">
          <div className="adm-top">
            <h2>{viewing.name}</h2>
            <button type="button" className="adm-btn" onClick={() => setViewing(null)}>Close</button>
          </div>
          <p>{viewing.description || "No description."}</p>
          <p className="adm-note">
            {viewing.category}{viewing.sub_category && ` › ${viewing.sub_category}`} · {viewing.brand || "No brand"} ·
            Size {viewing.size || "-"} · {viewing.color || "-"} · Stock {viewing.stock}
          </p>
          <div className="adm-actions">
            {JSON.parse(viewing.images || "[]").map((src) => (
              <img key={src} src={src} alt="" style={{ height: 120, borderRadius: 8 }} />
            ))}
          </div>
        </div>
      )}

      {/* ---------- product table ---------- */}
      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th></th><th>Name</th><th>Category</th><th>Brand</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.image && <img src={p.image} alt="" />}</td>
                <td>{p.name}</td>
                <td>{p.category}{p.sub_category && ` › ${p.sub_category}`}</td>
                <td>{p.brand}</td>
                <td>{rupees(p.price)}{p.discount > 0 && <span className="adm-note"> ({p.discount}% off)</span>}</td>
                <td>{p.stock}</td>
                <td><span className={`adm-badge ${p.status}`}>{p.status}</span></td>
                <td>
                  <div className="adm-actions">
                    <button type="button" className="adm-btn" onClick={() => setViewing(p)}>View</button>
                    <button type="button" className="adm-btn" onClick={() => openEdit(p)}>Edit</button>
                    <button type="button" className="adm-btn danger" onClick={() => remove(p)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="adm-empty">No products yet.</p>}
      </div>
    </>
  );
}

export default Products;
