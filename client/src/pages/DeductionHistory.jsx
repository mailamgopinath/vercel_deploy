import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import "../styles/Reports.css";

const API_URL = "/salary-deductions";
const EMPLOYEE_URL = "/employees";
const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function DeductionHistory() {
    const [records, setRecords] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filters, setFilters] = useState({
        employeeId: "",
        month: "",
        year: "",
        department: ""
    });
    const [correction, setCorrection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadHistory = useCallback(async () => {
        setError("");
        try {
            const params = Object.fromEntries(
                Object.entries(filters).filter(([, value]) => value !== "")
            );
            const response = await api.get(`${API_URL}/history`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                params
            });
            setRecords(response.data.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to load deduction history.");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        api.get(EMPLOYEE_URL, {
            headers: { Authorization: `Bearer ${getToken()}` },
            params: { status: "all", limit: 100 }
        }).then((response) => setEmployees(response.data.data.employees))
            .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load employee filters."));
    }, []);

    const departments = useMemo(
        () => [...new Set(employees.map((employee) => employee.department).filter(Boolean))],
        [employees]
    );

    const exportCsv = () => {
        const header = ["Employee code", "Employee name", "Department", "Month", "Year", "Monthly salary", "Total deduction", "Breakdown", "Created by", "Created at", "Remarks"];
        const lines = [
            header,
            ...records.map((record) => [
                record.employee_code,
                record.employee_name,
                record.department,
                record.month,
                record.year,
                record.monthly_salary,
                record.deduction_amount,
                JSON.stringify(record.calculation_details),
                record.created_by_name,
                record.created_at,
                record.remarks
            ])
        ].map((line) => line.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob(["\uFEFF", lines], { type: "text/csv;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "salary-deduction-history.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const saveCorrection = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        try {
            const response = await api.patch(`${API_URL}/${correction.id}`, {
                deduction_amount: Number(correction.amount),
                remarks: correction.reason
            }, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setNotice(response.data.message);
            setCorrection(null);
            await loadHistory();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to correct deduction.");
        }
    };

    return (
        <main className="report-page">
            <header className="report-header">
                <div><p className="report-eyebrow">AUDITABLE RECORDS</p><h1>Deduction history</h1><p>Review recorded monthly deductions and correction history.</p></div>
                <nav><Link to="/dashboard">Dashboard</Link><Link to="/salary-deductions/calculate">Calculator</Link><Link to="/settings/deductions">Settings</Link></nav>
            </header>
            {error && <div className="report-alert">{error}</div>}
            {notice && <div className="report-success">{notice}</div>}
            <section className="report-panel">
                <div className="report-history-filters">
                    <select aria-label="Filter by employee" value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}>
                        <option value="">All employees</option>
                        {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_code} — {employee.name}</option>)}
                    </select>
                    <select aria-label="Filter by month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}>
                        <option value="">All months</option>
                        {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index).toLocaleString("en", { month: "long" })}</option>)}
                    </select>
                    <input aria-label="Filter by year" type="number" min="2000" max="9999" placeholder="Year" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} />
                    <select aria-label="Filter by department" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
                        <option value="">All departments</option>
                        {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                    <button className="report-secondary-button" onClick={exportCsv} disabled={!records.length}>Export CSV</button>
                </div>
                <div className="table-responsive">
                    <table className="table report-table">
                        <thead><tr><th>Employee</th><th>Department</th><th>Period</th><th>Monthly salary</th><th>Deduction</th><th>Created by / date</th><th>Remarks</th><th>Breakdown / correction</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="8" className="report-empty">Loading history...</td></tr> : records.length === 0 ? <tr><td colSpan="8" className="report-empty">No deduction records found.</td></tr> : records.map((record) => {
                                let details = record.calculation_details;
                                if (typeof details === "string") {
                                    try { details = JSON.parse(details); } catch { details = null; }
                                }
                                return (
                                    <tr key={record.id}>
                                        <td className="report-name">{record.employee_code} — {record.employee_name}</td>
                                        <td>{record.department || "-"}</td>
                                        <td>{String(record.month).padStart(2, "0")}/{record.year}</td>
                                        <td>{Number(record.monthly_salary).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
                                        <td className="report-payable">{Number(record.deduction_amount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
                                        <td>{record.created_by_name || "-"}<br />{String(record.created_at).slice(0, 10)}</td>
                                        <td className="report-remarks">{record.remarks || "-"}</td>
                                        <td>
                                            <details className="report-breakdown">
                                                <summary>View details</summary>
                                                <pre>{details ? JSON.stringify(details, null, 2) : "No breakdown recorded."}</pre>
                                            </details>
                                            <button className="report-correct-button" onClick={() => setCorrection({ id: record.id, amount: Number(record.deduction_amount).toFixed(2), reason: "" })}>Correct</button>
                                            {correction?.id === record.id && (
                                                <form className="report-correction-form" onSubmit={saveCorrection}>
                                                    <label>Corrected amount
                                                        <input required type="number" min="0" step="0.01" value={correction.amount} onChange={(e) => setCorrection({ ...correction, amount: e.target.value })} />
                                                    </label>
                                                    <label>Correction reason *
                                                        <input required maxLength="500" value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })} />
                                                    </label>
                                                    <button className="report-primary-button">Save correction</button>
                                                    <button type="button" className="report-secondary-button" onClick={() => setCorrection(null)}>Cancel</button>
                                                </form>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="report-footnote">Corrections require a reason and are recorded in the audit log with before/after values. This is a deduction register, not a payroll or payment system.</p>
            </section>
        </main>
    );
}

export default DeductionHistory;
