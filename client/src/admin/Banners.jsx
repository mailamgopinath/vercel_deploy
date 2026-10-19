// /admin/banners -- pictures shown at the top of the home page.
import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const emptyForm = { title: "", subtitle: "", link: "", sort_order: "0", active: "1", image_url: "" };

function Banners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/admin/banners").then((response) => setBanners(response.data));
  }
  useEffect(load, []);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      link: banner.link || "",
      sort_order: String(banner.sort_order),
      active: String(banner.active),
      image_url: banner.image || "",
    });
    setFile(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setError("");

    // A picture file needs FormData (a form that can carry files).
    const data = new FormData();
    for (const key in form) data.append(key, form[key]);
    if (file) data.append("image", file);

    try {
      if (editingId) {
        await api.put(`/admin/banners/${editingId}`, data);
      } else {
        await api.post("/admin/banners", data);
      }
      reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(banner) {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;
    await api.delete(`/admin/banners/${banner.id}`);
    load();
  }

  return (
    <>
      <h1>Banners</h1>

      <form className="adm-panel adm-form" onSubmit={save}>
        <h2 className="wide">{editingId ? "Edit banner" : "Add banner"}</h2>
        {error && <p className="adm-error wide">{error}</p>}
        <label>Title
          <input name="title" value={form.title} onChange={change} required />
        </label>
        <label>Subtitle
          <input name="subtitle" value={form.subtitle} onChange={change} />
        </label>
        <label>Link (where it goes when clicked)
          <input name="link" value={form.link} onChange={change} placeholder="/shop" />
        </label>
        <label>Order (smaller shows first)
          <input name="sort_order" type="number" value={form.sort_order} onChange={change} />
        </label>
        <label>Status
          <select name="active" value={form.active} onChange={change}>
            <option value="1">Shown</option>
            <option value="0">Hidden</option>
          </select>
        </label>
        <label>Picture
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
        <label>...or picture web address
          <input name="image_url" value={form.image_url} onChange={change} placeholder="https://..." />
        </label>
        <div className="adm-form-actions">
          <button type="submit" className="adm-btn primary">{editingId ? "Save changes" : "Add banner"}</button>
          {editingId && <button type="button" className="adm-btn" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th></th><th>Title</th><th>Link</th><th>Order</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id}>
                <td>{b.image && <img src={b.image} alt="" />}</td>
                <td>{b.title}<div className="adm-note">{b.subtitle}</div></td>
                <td>{b.link}</td>
                <td>{b.sort_order}</td>
                <td><span className={`adm-badge ${b.active ? "active" : "inactive"}`}>{b.active ? "shown" : "hidden"}</span></td>
                <td>
                  <div className="adm-actions">
                    <button type="button" className="adm-btn" onClick={() => startEdit(b)}>Edit</button>
                    <button type="button" className="adm-btn danger" onClick={() => remove(b)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {banners.length === 0 && <p className="adm-empty">No banners yet.</p>}
      </div>
    </>
  );
}

export default Banners;
