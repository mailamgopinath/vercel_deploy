import React, { useCallback, useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import "../styles/Reports.css";

const API_URL = "/salary-deductions";
const EMPLOYEE_URL = "/employees";
const current = new Date();
const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

function SalaryDeductionCalculator() {
    const [month, setMonth] = useState(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`
    );
    const [employeeId, setEmployeeId] = useState("all");
    const [employees, setEmployees] = useState([]);
    const [rows, setRows] = useState([]);
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadCalculation = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [year, selectedMonth] = month.split("-").map(Number);
            const response = await api.get(`${API_URL}/calculate`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                params: { year, month: selectedMonth }
            });
            setRows(response.data.data.deductions);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to calculate deductions.");
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        loadCalculation();
    }, [loadCalculation]);

    useEffect(() => {
        api.get(EMPLOYEE_URL, {
            headers: { Authorization: `Bearer ${getToken()}` },
            params: { status: "active", limit: 100 }
        }).then((response) => setEmployees(response.data.data.employees))
            .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load employees."));
    }, []);

    const visibleRows = rows.filter((row) =>
        employeeId === "all" || row.employee_id === Number(employeeId)
    );
    const currency = (value) => Number(value).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });

    const save = async () => {
        if (!visibleRows.length) {
            setError("There are no active employees to save.");
            return;
        }
        if (!window.confirm(`Save the displayed deduction calculation for ${visibleRows.length} employee(s)? This creates monthly deduction records only; it does not pay salaries.`)) {
            return;
        }
        setSaving(true);
        setError("");
        setNotice("");
        try {
            const [year, selectedMonth] = month.split("-").map(Number);
            const response = await api.post(`${API_URL}/calculate`, {
                year,
                month: selectedMonth,
                employee_ids: employeeId === "all" ? undefined : [Number(employeeId)],
                remarks
            }, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setNotice(response.data.message);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to save deductions.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="report-page">
            <header className="report-header">
                <div><p className="report-eyebrow">DEDUCTION RECORDS ONLY</p><h1>Salary deduction calculator</h1><p>Review the calculation breakdown before saving monthly records.</p></div>
                <nav><Link to="/dashboard">Dashboard</Link><Link to="/settings/deductions">Settings</Link><Link to="/salary-deductions/history">History</Link></nav>
            </header>
            {error && <div className="report-alert">{error}</div>}
            {notice && <div className="report-success">{notice}</div>}
            <section className="report-panel">
                <div className="report-toolbar">
                    <label>Month
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                    </label>
                    <label>Employee
                        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                            <option value="all">All active employees</option>
                            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_code} — {employee.name}</option>)}
                        </select>
                    </label>
                </div>
                <p className="report-rule-note">Deductions are recalculated on the server when saved. Only absent and half-day records on working days that are not configured holidays are deducted; weekend and holiday records are excluded. Each attendance date is counted once.</p>
                <div className="table-responsive">
                    <table className="table report-table">
                        <thead><tr><th>Employee</th><th>Monthly salary</th><th>Working days</th><th>Payable days</th><th>Absent</th><th>Half days</th><th>Late</th><th>Per day</th><th>Absence</th><th>Half day</th><th>Other</th><th>Total deduction</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="12" className="report-empty">Calculating...</td></tr> : visibleRows.length === 0 ? <tr><td colSpan="12" className="report-empty">No active employee calculations found.</td></tr> : visibleRows.map((row) => (
                                <tr key={row.employee_id}>
                                    <td className="report-name">{row.employee_code} — {row.name}</td>
                                    <td>{currency(row.monthly_salary)}</td>
                                    <td>{Number(row.total_working_days).toFixed(2)}</td>
                                    <td>{Number(row.payable_days).toFixed(2)}</td>
                                    <td>{row.absent_days}</td><td>{row.half_days}</td><td>{row.late_arrivals}</td>
                                    <td>{currency(row.per_day_salary)}</td><td>{currency(row.absent_deduction)}</td><td>{currency(row.half_day_deduction)}</td><td>{currency(row.late_deduction)}</td>
                                    <td className="report-payable">{currency(row.deduction_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <label className="report-remarks-input">Remarks (optional)
                    <input maxLength="500" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Note for deduction history" />
                </label>
                <div className="report-action-footer">
                    <p>This records deduction data only. It does not issue payslips or process payments.</p>
                    <button className="report-primary-button" disabled={loading || saving || visibleRows.length === 0} onClick={save}>{saving ? "Saving..." : "Confirm and save deductions"}</button>
                </div>
            </section>
        </main>
    );
}

export default SalaryDeductionCalculator;
