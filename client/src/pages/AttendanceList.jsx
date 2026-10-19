import React, { useCallback, useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import "../styles/AttendanceList.css";

const API_URL = "/attendance/records";

const getLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const today = getLocalDate(new Date());
const monthStart = `${today.slice(0, 7)}-01`;

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const formatDate = (date) => {
    if (!date) {
        return "-";
    }
    const value = String(date);
    const parsed = value.includes("T")
        ? new Date(value)
        : new Date(`${value.slice(0, 10)}T00:00:00`);
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const formatTime = (time) => (time ? String(time).slice(0, 5) : "-");

function AttendanceList() {
    const [startDate, setStartDate] = useState(monthStart);
    const [endDate, setEndDate] = useState(today);
    const [search, setSearch] = useState("");
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRecords = useCallback(async () => {
        setError("");
        try {
            const response = await api.get(API_URL, {
                headers: { Authorization: `Bearer ${getToken()}` },
                params: { startDate, endDate, search: search.trim() }
            });
            setRecords(response.data.data.records);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to load attendance list."
            );
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, search]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    return (
        <main className="attendance-list-page">
            <header className="attendance-list-header">
                <div>
                    <p className="attendance-list-eyebrow">ATTENDANCE RECORDS</p>
                    <h1>Attendance list</h1>
                    <p>Review employee attendance and recorded working hours.</p>
                </div>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/attendance/mark">Mark attendance</Link>
                    <Link to="/employees">Employees</Link>
                </nav>
            </header>

            {error && <div className="attendance-list-alert">{error}</div>}

            <section className="attendance-list-panel">
                <div className="attendance-list-filters">
                    <label>
                        <span>
                            <FaCalendarAlt /> From
                        </span>
                        <input
                            type="date"
                            value={startDate}
                            max={endDate}
                            onChange={(event) => setStartDate(event.target.value)}
                        />
                    </label>
                    <label>
                        <span>
                            <FaCalendarAlt /> To
                        </span>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate}
                            onChange={(event) => setEndDate(event.target.value)}
                        />
                    </label>
                    <label className="attendance-list-search">
                        <span>Employee name or code</span>
                        <input
                            type="search"
                            placeholder="Search attendance"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>
                    <div className="attendance-list-count">
                        {records.length} record{records.length === 1 ? "" : "s"}
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table attendance-list-table">
                        <thead>
                            <tr>
                                <th>Employee code</th>
                                <th>Employee name</th>
                                <th>Department</th>
                                <th>Attendance date</th>
                                <th>Status</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>
                                    <FaClock /> Working hours
                                </th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="attendance-list-empty">
                                        Loading attendance records...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="attendance-list-empty">
                                        No attendance records found for the selected
                                        dates.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.employee_code}</td>
                                        <td className="attendance-list-name">
                                            {record.name}
                                        </td>
                                        <td>{record.department || "-"}</td>
                                        <td>{formatDate(record.attendance_date)}</td>
                                        <td>
                                            <span
                                                className={`attendance-list-status ${String(
                                                    record.attendance_status
                                                )
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")}`}
                                            >
                                                {record.attendance_status}
                                            </span>
                                        </td>
                                        <td>{formatTime(record.check_in)}</td>
                                        <td>{formatTime(record.check_out)}</td>
                                        <td>
                                            {record.working_hours === null
                                                ? "-"
                                                : `${Number(
                                                      record.working_hours
                                                  ).toFixed(2)} hrs`}
                                        </td>
                                        <td className="attendance-list-remarks">
                                            {record.remarks || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <footer className="attendance-list-footer">
                    Working hours are calculated from check-in and check-out times.
                </footer>
            </section>
        </main>
    );
}

export default AttendanceList;
