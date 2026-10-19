import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import "../styles/Reports.css";

const API_URL = "/settings/deductions";
const HOLIDAY_URL = "/holidays";
const defaults = {
    working_days_per_month: 26,
    working_hours_per_day: 8,
    per_day_method: "fixed_working_days",
    half_day_multiplier: 0.5,
    absent_multiplier: 1,
    late_deduction_enabled: false,
    late_after: "09:00",
    late_deduction_amount: 0
};
const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

function DeductionSettings() {
    const [settings, setSettings] = useState(defaults);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [holidays, setHolidays] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [holidayForm, setHolidayForm] = useState({
        date: "",
        name: "",
        department: ""
    });

    useEffect(() => {
        api.get(API_URL, {
            headers: { Authorization: `Bearer ${getToken()}` }
        }).then((response) => {
            const values = response.data.data;
            setSettings({
                ...values,
                late_after: String(values.late_after).slice(0, 5),
                late_deduction_enabled: Boolean(values.late_deduction_enabled)
            });
        }).catch((requestError) => {
            setError(requestError.response?.data?.message || "Unable to load settings.");
        }).finally(() => setLoading(false));
    }, []);

    const loadHolidays = async () => {
        try {
            const response = await api.get(HOLIDAY_URL, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setHolidays(response.data.data.holidays);
            setDepartments(response.data.data.departments);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to load holidays."
            );
        }
    };

    useEffect(() => {
        loadHolidays();
    }, []);

    const update = (field, value) =>
        setSettings((current) => ({ ...current, [field]: value }));

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");
        try {
            const numericFields = [
                "working_days_per_month",
                "working_hours_per_day",
                "half_day_multiplier",
                "absent_multiplier",
                "late_deduction_amount"
            ];
            const body = { ...settings };
            numericFields.forEach((field) => {
                body[field] = Number(body[field]);
            });
            const response = await api.put(API_URL, body, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setNotice(response.data.message);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const addHoliday = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        try {
            const response = await api.post(HOLIDAY_URL, holidayForm, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setNotice(response.data.message);
            setHolidayForm({ date: "", name: "", department: "" });
            await loadHolidays();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to add holiday."
            );
        }
    };

    const removeHoliday = async (holiday) => {
        if (!window.confirm(`Remove ${holiday.name} on ${String(holiday.holiday_date).slice(0, 10)}?`)) {
            return;
        }
        setError("");
        setNotice("");
        try {
            const response = await api.delete(
                `${HOLIDAY_URL}/${holiday.id}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setNotice(response.data.message);
            await loadHolidays();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to remove holiday."
            );
        }
    };

    return (
        <main className="report-page">
            <header className="report-header">
                <div><p className="report-eyebrow">CONFIGURATION</p><h1>Deduction settings</h1><p>Configure attendance rules used by reports and deduction calculations.</p></div>
                <nav><Link to="/dashboard">Dashboard</Link><Link to="/salary-deductions/calculate">Calculator</Link></nav>
            </header>
            {error && <div className="report-alert">{error}</div>}
            {notice && <div className="report-success">{notice}</div>}
            <section className="report-panel">
                {loading ? <p>Loading settings...</p> : (
                    <form className="report-form-grid" onSubmit={save}>
                        <label>Standard working days per month
                            <input type="number" min="1" max="31" step="0.5" required value={settings.working_days_per_month} onChange={(e) => update("working_days_per_month", e.target.value)} />
                        </label>
                        <label>Working hours per day
                            <input type="number" min="0.1" max="24" step="0.1" required value={settings.working_hours_per_day} onChange={(e) => update("working_hours_per_day", e.target.value)} />
                        </label>
                        <label>Per-day salary method
                            <select value={settings.per_day_method} onChange={(e) => update("per_day_method", e.target.value)}>
                                <option value="fixed_working_days">Monthly salary ÷ configured working days</option>
                                <option value="calendar_days">Monthly salary ÷ calendar days in selected month</option>
                            </select>
                        </label>
                        <label>Half-day deduction multiplier
                            <input type="number" min="0" max="1" step="0.05" value={settings.half_day_multiplier} onChange={(e) => update("half_day_multiplier", e.target.value)} />
                        </label>
                        <label>Absent-day deduction multiplier
                            <input type="number" min="0" max="2" step="0.05" value={settings.absent_multiplier} onChange={(e) => update("absent_multiplier", e.target.value)} />
                        </label>
                        <label>Late arrival cutoff
                            <input type="time" required value={settings.late_after} onChange={(e) => update("late_after", e.target.value)} />
                        </label>
                        <label>Deduction per late arrival
                            <input type="number" min="0" step="0.01" value={settings.late_deduction_amount} onChange={(e) => update("late_deduction_amount", e.target.value)} />
                        </label>
                        <label className="report-check">
                            <input type="checkbox" checked={settings.late_deduction_enabled} onChange={(e) => update("late_deduction_enabled", e.target.checked)} />
                            Apply optional late-arrival deduction
                        </label>
                        <div className="report-full-field report-rule-note">
                            Salary deductions are calculated from Absent and Half Day attendance records only. Half days use the configured multiplier. Weekend and configured holiday absences are excluded; the fixed-working-days divisor is an explicit configured denominator, while calendar-days uses the selected month length. No payroll or salary payment is processed.
                        </div>
                        <button className="report-primary-button" disabled={saving}>{saving ? "Saving..." : "Save settings"}</button>
                    </form>
                )}
            </section>
            <section className="report-panel">
                <h2>Holidays and department scope</h2>
                <form className="report-form-grid" onSubmit={addHoliday}>
                    <label>Date *
                        <input required type="date" value={holidayForm.date} onChange={(event) => setHolidayForm({ ...holidayForm, date: event.target.value })} />
                    </label>
                    <label>Holiday name *
                        <input required maxLength="150" value={holidayForm.name} onChange={(event) => setHolidayForm({ ...holidayForm, name: event.target.value })} />
                    </label>
                    <label>Scope
                        <select value={holidayForm.department} onChange={(event) => setHolidayForm({ ...holidayForm, department: event.target.value })}>
                            <option value="">All departments</option>
                            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                        </select>
                    </label>
                    <button className="report-primary-button">Add holiday</button>
                </form>
                <div className="table-responsive report-holiday-table">
                    <table className="table report-table">
                        <thead><tr><th>Date</th><th>Holiday</th><th>Scope</th><th>Action</th></tr></thead>
                        <tbody>
                            {holidays.length === 0 ? <tr><td colSpan="4" className="report-empty">No holidays configured.</td></tr> : holidays.map((holiday) => (
                                <tr key={holiday.id}>
                                    <td>{String(holiday.holiday_date).slice(0, 10)}</td>
                                    <td>{holiday.name}</td>
                                    <td>{holiday.department || "All departments"}</td>
                                    <td><button className="report-correct-button" onClick={() => removeHoliday(holiday)}>Remove</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="report-footnote">Weekends are currently fixed as Saturday and Sunday. Attendance marked Absent or Half Day on weekends or configured holidays remains visible in reports but is not deducted.</p>
            </section>
        </main>
    );
}

export default DeductionSettings;
