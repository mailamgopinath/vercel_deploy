// One page that manages a simple list: categories, brands, sizes or colors.
// App.jsx uses it four times with different props, e.g.
//   <Lists title="Brands" endpoint="brands" />
// Pass withParent to let each row choose a parent (this is how sub categories work).

import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

function Lists({ title, endpoint, withParent = false }) {
  const [rows, setRows] = useState([]);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.get(`/admin/${endpoint}`).then((response) => setRows(response.data));
  }

  // Reload when the admin switches to a different list (e.g. Brands -> Sizes).
  useEffect(() => {
    load();
    setEditingId(null);
    setError("");
  }, [endpoint]);

  async function add(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post(`/admin/${endpoint}`, { name: newName, parent_id: newParent || null });
      setNewName("");
      setNewParent("");
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function saveEdit(row) {
    setError("");
    try {
      await api.put(`/admin/${endpoint}/${row.id}`, { name: editName, parent_id: row.parent_id });
      setEditingId(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    await api.delete(`/admin/${endpoint}/${row.id}`);
    load();
  }

  const parentName = (id) => rows.find((r) => r.id === id)?.name || "";

  return (
    <>
      <h1>{title}</h1>

      <form className="adm-add-row" onSubmit={add}>
        <input placeholder={`New ${title.toLowerCase().replace(/s$/, "")} name`} value={newName} onChange={(e) => setNewName(e.target.value)} required />
        {withParent && (
          <select value={newParent} onChange={(e) => setNewParent(e.target.value)}>
            <option value="">Main category</option>
            {rows.filter((r) => !r.parent_id).map((r) => <option key={r.id} value={r.id}>Sub category of {r.name}</option>)}
          </select>
        )}
        <button type="submit" className="adm-btn primary">Add</button>
      </form>
      {error && <p className="adm-error">{error}</p>}

      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Name</th>{withParent && <th>Type</th>}<th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {editingId === row.id
                    ? <input className="adm-inline-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    : row.name}
                </td>
                {withParent && <td>{row.parent_id ? `Sub category of ${parentName(row.parent_id)}` : "Main category"}</td>}
                <td>
                  <div className="adm-actions">
                    {editingId === row.id ? (
                      <>
                        <button type="button" className="adm-btn primary" onClick={() => saveEdit(row)}>Save</button>
                        <button type="button" className="adm-btn" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="adm-btn" onClick={() => { setEditingId(row.id); setEditName(row.name); }}>Edit</button>
                        <button type="button" className="adm-btn danger" onClick={() => remove(row)}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="adm-empty">Nothing here yet.</p>}
      </div>
    </>
  );
}

export default Lists;
