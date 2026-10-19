// /admin/dashboard -- totals and charts.
import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// "2026-10" -> "Oct 2026"
function monthName(month) {
  const [year, number] = month.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(number) - 1]} ${year.slice(2)}`;
}

// A simple vertical bar chart. "data" looks like [{ label: "Oct 26", value: 1499 }, ...]
function BarChart({ data, format = (n) => n }) {
  if (data.length === 0) return <p className="adm-empty">No data yet.</p>;
  const biggest = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="adm-bars">
      {data.map((d) => (
        <div className="adm-bar-col" key={d.label}>
          <span className="adm-bar-value">{format(d.value)}</span>
          <div className="adm-bar" style={{ height: `${(d.value / biggest) * 100}%` }} />
          <span className="adm-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="adm-error">{error}</p>;
  if (!data) return <p>Loading...</p>;

  const cards = [
    ["Total Orders", data.totalOrders],
    ["Total Sales", rupees(data.totalSales)],
    ["Total Customers", data.totalCustomers],
    ["Total Products", data.totalProducts],
    ["Pending Orders", data.pendingOrders],
    ["Delivered Orders", data.deliveredOrders],
  ];
  const mostSold = Math.max(...data.topProducts.map((p) => p.sold), 1);

  return (
    <>
      <h1>Dashboard</h1>

      <div className="adm-cards">
        {cards.map(([label, value]) => (
          <div className="adm-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="adm-grid-2">
        <div className="adm-panel">
          <h2>Sales by month</h2>
          <BarChart
            data={data.byMonth.map((m) => ({ label: monthName(m.month), value: m.sales }))}
            format={rupees}
          />
        </div>

        <div className="adm-panel">
          <h2>Orders by month</h2>
          <BarChart data={data.byMonth.map((m) => ({ label: monthName(m.month), value: m.orders }))} />
        </div>
      </div>

      <div className="adm-panel">
        <h2>Top selling products</h2>
        {data.topProducts.length === 0 && <p className="adm-empty">No sales yet.</p>}
        {data.topProducts.map((p) => (
          <div className="adm-hbar-row" key={p.id}>
            <span>{p.name}</span>
            <div><i style={{ width: `${(p.sold / mostSold) * 100}%` }} /></div>
            <strong>{p.sold}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

export default Dashboard;
