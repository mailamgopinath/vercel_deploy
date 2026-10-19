// /admin/reports -- pick a report, optionally a date range, and download it as a CSV file.
import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const reportTypes = [
  ["sales", "Sales report"],
  ["orders", "Order report"],
  ["products", "Product report"],
  ["customers", "Customer report"],
  ["inventory", "Inventory report"],
];

// Wrap a cell in quotes if it has a comma or quote, so Excel reads it correctly.
function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function Reports() {
  const [type, setType] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  // Reload whenever the report type or dates change.
  useEffect(() => {
    setError("");
    api.get(`/admin/reports/${type}`, { params: { from: from || undefined, to: to || undefined } })
      .then((response) => setReport(response.data))
      .catch((err) => setError(errorMessage(err)));
  }, [type, from, to]);

  function downloadCsv() {
    const lines = [report.columns, ...report.rows].map((row) => row.map(csvCell).join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });

    // Make a temporary link to the file and click it.
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${type}-report.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <>
      <div className="adm-top">
        <h1>Reports</h1>
        <button type="button" className="adm-btn primary" onClick={downloadCsv} disabled={!report}>Download CSV</button>
      </div>

      <div className="adm-add-row">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {reportTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {type !== "inventory" && (
          <>
            <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </>
        )}
      </div>
      {error && <p className="adm-error">{error}</p>}

      {report && (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>{report.columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {report.rows.map((row, index) => (
                <tr key={index}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
          {report.rows.length === 0 && <p className="adm-empty">No data for this report.</p>}
        </div>
      )}
    </>
  );
}

export default Reports;
