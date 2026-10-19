import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import "../styles/Reports.css";

const API_URL = "/reports/monthly-attendance";
const current = new Date();
const token = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function MonthlyAttendanceReport() {
    const [month, setMonth] = useState(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`
    );
    const [rows, setRows] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const [year, selectedMonth] = month.split("-").map(Number);
                const response = await api.get(API_URL, {
                    headers: { Authorization: `Bearer ${token()}` },
                    params: { year, month: selectedMonth }
                });
                setRows(response.data.data.employees);
                setSettings(response.data.data.settings);
            } catch (requestError) {
                setError(
                    requestError.response?.data?.message ||
                        "Unable to load monthly attendance report."
                );
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [month]);

    const exportCsv = () => {
        const headers = [
            "Employee code",
            "Employee name",
            "Department",
            "Present days",
            "Absent days",
            "Half days",
            "Late arrivals",
            "Working hours",
            "Payable days"
        ];
        const lines = [
            headers,
            ...rows.map((row) => [
                row.employee_code,
                row.name,
                row.department,
                row.present_days,
                row.absent_days,
                row.half_days,
                row.late_arrivals,
                row.working_hours,
                row.payable_days
            ])
        ]
            .map((line) => line.map(csvCell).join(","))
            .join("\r\n");
        const url = URL.createObjectURL(
            new Blob(["\uFEFF", lines], { type: "text/csv;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `monthly-attendance-${month}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className="report-page">
            <header className="report-header">
                <div>
                    <p className="report-eyebrow">REPORTS</p>
                    <h1>Monthly attendance</h1>
                    <p>Employee-wise attendance totals and payable days.</p>
                </div>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/attendance/list">Attendance list</Link>
                </nav>
            </header>
            {error && <div className="report-alert">{error}</div>}
            <section className="report-panel">
                <div className="report-toolbar">
                    <label>
                        Select month
                        <input
                            type="month"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                        />
                    </label>
                    <button
                        className="report-primary-button"
                        disabled={loading || rows.length === 0}
                        onClick={exportCsv}
                    >
                        Export CSV
                    </button>
                </div>
                {settings && (
                    <p className="report-rule-note">
                        Payable days = present days + half days using the configured
                        half-day payable factor. Absent and half-day entries on
                        weekends or holidays do not create deductions. Late arrivals
                        use the configured cutoff of{" "}
                        {String(settings.late_after).slice(0, 5)}.
                    </p>
                )}
                <div className="table-responsive">
                    <table className="table report-table">
                        <thead>
                            <tr>
                                <th>Employee code</th>
                                <th>Employee name</th>
                                <th>Department</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Half day</th>
                                <th>Late arrivals</th>
                                <th>Working hours</th>
                                <th>Payable days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" className="report-empty">Loading report...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan="9" className="report-empty">No employees found for this report.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.employee_id}>
                                    <td>{row.employee_code}</td>
                                    <td className="report-name">{row.name}</td>
                                    <td>{row.department || "-"}</td>
                                    <td>{row.present_days}</td>
                                    <td>{row.absent_days}</td>
                                    <td>{row.half_days}</td>
                                    <td>{row.late_arrivals}</td>
                                    <td>{Number(row.working_hours).toFixed(2)}</td>
                                    <td className="report-payable">{Number(row.payable_days).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="report-footnote">
                    Each attendance date is counted once. Attendance statuses
                    included are Present, Absent, and Half Day.
                </p>
            </section>
        </main>
    );
}

export default MonthlyAttendanceReport;
