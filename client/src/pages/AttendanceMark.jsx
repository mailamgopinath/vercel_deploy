import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { FaCalendarCheck, FaSave } from "react-icons/fa";
import "../styles/AttendanceMark.css";

const API_URL = "/attendance";
const attendanceStatuses = ["Present", "Absent", "Half Day"];

const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const fromApiTime = (time) => (time ? String(time).slice(0, 5) : "");

function AttendanceMark() {
    const [date, setDate] = useState(getLocalDate);
    const [search, setSearch] = useState("");
    const [employees, setEmployees] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadAttendance = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get(API_URL, {
                headers: { Authorization: `Bearer ${getToken()}` },
                params: { date }
            });
            const rows = response.data.data.employees;
            setEmployees(rows);
            setDrafts(
                Object.fromEntries(
                    rows.map((employee) => [
                        employee.employee_id,
                        {
                            status: employee.attendance_status || "",
                            check_in: fromApiTime(employee.check_in),
                            check_out: fromApiTime(employee.check_out),
                            remarks: employee.remarks || ""
                        }
                    ])
                )
            );
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to load attendance records."
            );
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    const visibleEmployees = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return employees;
        }
        return employees.filter(
            (employee) =>
                employee.name.toLowerCase().includes(query) ||
                employee.employee_code.toLowerCase().includes(query)
        );
    }, [employees, search]);

    const markedCount = employees.reduce(
        (count, employee) =>
            count + (drafts[employee.employee_id]?.status ? 1 : 0),
        0
    );

    const updateDraft = (employeeId, field, value) => {
        setDrafts((current) => ({
            ...current,
            [employeeId]: {
                ...current[employeeId],
                [field]: value
            }
        }));
        setError("");
        setNotice("");
    };

    const saveAttendance = async (event) => {
        event.preventDefault();
        const records = employees
            .filter((employee) => drafts[employee.employee_id]?.status)
            .map((employee) => ({
                employee_id: employee.employee_id,
                ...drafts[employee.employee_id]
            }));

        if (records.length === 0) {
            setError("Mark at least one employee before saving attendance.");
            return;
        }

        setSaving(true);
        setError("");
        setNotice("");
        try {
            const response = await api.put(
                API_URL,
                { date, records },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setNotice(response.data.message);
            await loadAttendance();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to save attendance records."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="attendance-mark-page">
            <header className="attendance-mark-header">
                <div>
                    <p className="attendance-eyebrow">DAILY OPERATIONS</p>
                    <h1>Mark attendance</h1>
                    <p>Record and update attendance for active employees.</p>
                </div>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/employees">Employees</Link>
                    <Link to="/attendance/list">Attendance list</Link>
                </nav>
            </header>

            {error && <div className="attendance-alert error">{error}</div>}
            {notice && <div className="attendance-alert success">{notice}</div>}

            <section className="attendance-mark-panel">
                <div className="attendance-mark-toolbar">
                    <label className="attendance-date-field">
                        <span>
                            <FaCalendarCheck /> Attendance date
                        </span>
                        <input
                            type="date"
                            value={date}
                            onChange={(event) => {
                                setDate(event.target.value);
                                setNotice("");
                            }}
                        />
                    </label>
                    <label className="attendance-search-field">
                        <span>Search by employee name or code</span>
                        <input
                            type="search"
                            placeholder="Search employees"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>
                    <div className="attendance-mark-count">
                        {markedCount} of {employees.length} marked
                    </div>
                </div>

                <form onSubmit={saveAttendance}>
                    <div className="table-responsive">
                        <table className="table attendance-mark-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Code</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Check in</th>
                                    <th>Check out</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="attendance-mark-empty"
                                        >
                                            Loading employees...
                                        </td>
                                    </tr>
                                ) : visibleEmployees.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="attendance-mark-empty"
                                        >
                                            {employees.length
                                                ? "No employees match your search."
                                                : "No active employees found. Add an active employee first."}
                                        </td>
                                    </tr>
                                ) : (
                                    visibleEmployees.map((employee) => {
                                        const draft =
                                            drafts[employee.employee_id] || {};
                                        return (
                                            <tr key={employee.employee_id}>
                                                <td className="attendance-employee-name">
                                                    {employee.name}
                                                </td>
                                                <td>{employee.employee_code}</td>
                                                <td>{employee.department || "-"}</td>
                                                <td>
                                                    <select
                                                        aria-label={`Attendance status for ${employee.name}`}
                                                        value={draft.status || ""}
                                                        onChange={(event) =>
                                                            updateDraft(
                                                                employee.employee_id,
                                                                "status",
                                                                event.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Not marked
                                                        </option>
                                                        {attendanceStatuses.map(
                                                            (status) => (
                                                                <option
                                                                    key={status}
                                                                    value={status}
                                                                >
                                                                    {status}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        aria-label={`Check-in time for ${employee.name}`}
                                                        type="time"
                                                        value={draft.check_in || ""}
                                                        onChange={(event) =>
                                                            updateDraft(
                                                                employee.employee_id,
                                                                "check_in",
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        aria-label={`Check-out time for ${employee.name}`}
                                                        type="time"
                                                        value={draft.check_out || ""}
                                                        onChange={(event) =>
                                                            updateDraft(
                                                                employee.employee_id,
                                                                "check_out",
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        aria-label={`Remarks for ${employee.name}`}
                                                        type="text"
                                                        maxLength="1000"
                                                        placeholder="Optional"
                                                        value={draft.remarks || ""}
                                                        onChange={(event) =>
                                                            updateDraft(
                                                                employee.employee_id,
                                                                "remarks",
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <footer className="attendance-mark-footer">
                        <p>
                            {employees.some((employee) => employee.attendance_id)
                                ? "Saving updates existing records for this date."
                                : "Unmarked employees will not receive an attendance record."}
                        </p>
                        <button
                            type="submit"
                            className="attendance-save-button"
                            disabled={loading || saving || markedCount === 0}
                        >
                            <FaSave />
                            {saving ? "Saving..." : "Save attendance"}
                        </button>
                    </footer>
                </form>
            </section>
        </main>
    );
}

export default AttendanceMark;
