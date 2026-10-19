import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import {
    FaCalendarAlt,
    FaCalendarCheck,
    FaEllipsisH,
    FaSearch,
    FaSignOutAlt,
    FaUserCheck,
    FaUserClock,
    FaUserTimes
} from "react-icons/fa";

const dashboardToday = new Date();

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

function Dashboard() {
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        halfDayToday: 0,
        checkedOutToday: 0,
        missingCheckoutToday: 0,
        lateToday: 0,
        monthlyDeductions: 0
    });
    const [attendance, setAttendance] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = getToken();
                if (!token) {
                    setError("Please login to view the dashboard.");
                    return;
                }

                const response = await api.get(
                    "/dashboard",
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.data.status) {
                    setSummary((current) => ({
                        ...current,
                        ...response.data.data.summary
                    }));
                    setAttendance(response.data.data.attendance);
                    setTrends(response.data.data.trends || []);
                }
            } catch (requestError) {
                setError(
                    requestError.response?.data?.message ||
                        "Unable to load dashboard data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const visibleAttendance = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return attendance;
        }
        return attendance.filter((item) =>
            [item.employee_code, item.name, item.department, item.status]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [attendance, search]);

    const trendDays = useMemo(() => {
        const byDate = new Map(
            trends.map((trend) => [String(trend.date).slice(0, 10), trend])
        );
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(dashboardToday.getTime());
            date.setDate(date.getDate() - (6 - index));
            const key = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const value = byDate.get(key);
            return {
                date,
                checkedIn: Number(value?.on_time_count || 0),
                late: Number(value?.late_count || 0),
                overtime: Number(value?.overtime_hours || 0)
            };
        });
    }, [trends]);

    const maxCheckedIn = Math.max(
        1,
        ...trendDays.map((day) => day.checkedIn)
    );
    const maxOvertime = Math.max(
        1,
        ...trendDays.map((day) => day.overtime)
    );
    const presentPercent =
        summary.totalEmployees > 0
            ? Math.min(
                  100,
                  Math.round(
                      (summary.presentToday / summary.totalEmployees) * 100
                  )
              )
            : 0;
    const notPresent = Math.max(
        0,
        summary.totalEmployees - summary.presentToday
    );

    const statCards = [
        {
            label: "Checked in",
            value: summary.presentToday,
            icon: <FaUserCheck />,
            tone: "blue"
        },
        {
            label: "Absent today",
            value: summary.absentToday,
            icon: <FaUserTimes />,
            tone: "red"
        },
        {
            label: "Half day",
            value: summary.halfDayToday,
            icon: <FaCalendarCheck />,
            tone: "green"
        },
        {
            label: "Late arrivals",
            value: summary.lateToday,
            icon: <FaUserClock />,
            tone: "orange"
        },
        {
            label: "Checked out",
            value: summary.checkedOutToday,
            icon: <FaSignOutAlt />,
            tone: "purple"
        }
    ];

    if (loading) {
        return <div className="dashboard-message">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div className="dashboard-message dashboard-error">{error}</div>
        );
    }

    return (
                <main className="dashboard-content">
                    <div className="dashboard-welcome">
                        <div>
                            <h1>Good day, Admin</h1>
                            <p>
                                Here&apos;s your attendance overview for today.
                            </p>
                        </div>
                        <div className="dashboard-date">
                            <FaCalendarAlt />
                            {dashboardToday.toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            })}
                        </div>
                    </div>

                    <section className="dashboard-overview-grid">
                        <article className="dashboard-panel statistics-panel">
                            <div className="panel-title-row">
                                <h2>Statistics</h2>
                                <button
                                    aria-label="Statistics options"
                                    className="panel-menu"
                                >
                                    <FaEllipsisH />
                                </button>
                            </div>
                            <div className="statistics-content">
                                <div
                                    className="employee-donut"
                                    style={{
                                        "--present-percent": `${presentPercent}%`
                                    }}
                                    role="img"
                                    aria-label={`${presentPercent}% checked in today`}
                                >
                                    <div className="donut-center">
                                        <span>Total employees</span>
                                        <strong>
                                            {Number(
                                                summary.totalEmployees
                                            ).toLocaleString("en-IN")}
                                        </strong>
                                    </div>
                                </div>
                                <div className="donut-legend">
                                    <span>
                                        <i className="legend-blue" />
                                        {presentPercent}% checked in
                                    </span>
                                    <span>
                                        <i className="legend-gray" />
                                        {notPresent} not checked in
                                    </span>
                                </div>
                            </div>
                        </article>

                        <article className="dashboard-panel attendance-summary-panel">
                            <div className="panel-title-row">
                                <h2>Today&apos;s attendance</h2>
                                <Link to="/attendance/mark">View all</Link>
                            </div>
                            <div className="attendance-stats-grid">
                                {statCards.map((card) => (
                                    <div
                                        className="attendance-stat-card"
                                        key={card.label}
                                    >
                                        <span
                                            className={`attendance-stat-icon ${card.tone}`}
                                        >
                                            {card.icon}
                                        </span>
                                        <span className="attendance-stat-label">
                                            {card.label}
                                        </span>
                                        <strong className={card.tone}>
                                            {Number(card.value).toLocaleString(
                                                "en-IN"
                                            )}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>

                    <section className="dashboard-analytics-grid">
                        <article className="dashboard-panel chart-panel">
                            <div className="panel-title-row">
                                <div>
                                    <h2>On-time check in</h2>
                                    <p>Present employees during the last 7 days</p>
                                </div>
                                <span className="chart-period">7 days</span>
                            </div>
                            <div className="bar-chart" aria-label="Present employee trend">
                                <div className="chart-y-axis">
                                    <span>{maxCheckedIn}</span>
                                    <span>{Math.round(maxCheckedIn * 0.66)}</span>
                                    <span>{Math.round(maxCheckedIn * 0.33)}</span>
                                    <span>0</span>
                                </div>
                                <div className="bar-chart-body">
                                    <div className="chart-grid-lines">
                                        <i /><i /><i /><i />
                                    </div>
                                    <div className="bar-columns">
                                        {trendDays.map((day) => (
                                            <div
                                                className="bar-column"
                                                key={day.date.toISOString()}
                                            >
                                                <div className="bar-track">
                                                    <span
                                                        className="chart-bar present-bar"
                                                        style={{
                                                            height: `${Math.max(
                                                                day.checkedIn
                                                                    ? 6
                                                                    : 0,
                                                                (day.checkedIn /
                                                                    maxCheckedIn) *
                                                                    100
                                                            )}%`
                                                        }}
                                                        title={`${day.checkedIn} present, ${day.late} late`}
                                                    />
                                                </div>
                                                <small>
                                                    {day.date.toLocaleDateString(
                                                        "en-IN",
                                                        { day: "numeric", month: "short" }
                                                    )}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="chart-legend">
                                <span><i className="legend-blue" /> Present</span>
                                <span><i className="legend-orange" /> Late arrivals are shown in exceptions</span>
                            </div>
                        </article>

                        <article className="dashboard-panel chart-panel">
                            <div className="panel-title-row">
                                <div>
                                    <h2>Overtime</h2>
                                    <p>Hours above configured daily working hours</p>
                                </div>
                                <Link to="/settings/deductions">Settings</Link>
                            </div>
                            <div className="bar-chart" aria-label="Overtime hours trend">
                                <div className="chart-y-axis">
                                    <span>{maxOvertime.toFixed(0)}</span>
                                    <span>{(maxOvertime * 0.66).toFixed(0)}</span>
                                    <span>{(maxOvertime * 0.33).toFixed(0)}</span>
                                    <span>0</span>
                                </div>
                                <div className="bar-chart-body">
                                    <div className="chart-grid-lines">
                                        <i /><i /><i /><i />
                                    </div>
                                    <div className="bar-columns">
                                        {trendDays.map((day) => (
                                            <div
                                                className="bar-column"
                                                key={day.date.toISOString()}
                                            >
                                                <div className="bar-track">
                                                    <span
                                                        className="chart-bar overtime-bar"
                                                        style={{
                                                            height: `${
                                                                day.overtime
                                                                    ? Math.max(
                                                                          6,
                                                                          (day.overtime /
                                                                              maxOvertime) *
                                                                              100
                                                                      )
                                                                    : 0
                                                            }%`
                                                        }}
                                                        title={`${day.overtime.toFixed(2)} overtime hours`}
                                                    />
                                                </div>
                                                <small>
                                                    {day.date.toLocaleDateString(
                                                        "en-IN",
                                                        { day: "numeric", month: "short" }
                                                    )}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="chart-legend">
                                <span><i className="legend-blue" /> Overtime hours</span>
                            </div>
                        </article>

                        <article className="dashboard-panel exceptions-panel">
                            <div className="panel-title-row">
                                <h2>Exceptions</h2>
                                <Link to="/attendance/list">Attendance list</Link>
                            </div>
                            <div className="exception-cards">
                                <div className="exception-card">
                                    <span>Late arrivals today</span>
                                    <strong className="orange">
                                        {summary.lateToday}
                                    </strong>
                                </div>
                                <div className="exception-card">
                                    <span>Missing check-out</span>
                                    <strong className="red">
                                        {summary.missingCheckoutToday}
                                    </strong>
                                </div>
                            </div>
                        </article>
                    </section>

                    <section className="dashboard-bottom-grid">
                        <article className="dashboard-panel pending-panel">
                            <div className="panel-title-row">
                                <h2>Attendance marked</h2>
                                <Link to="/attendance/mark">Mark attendance</Link>
                            </div>
                            <Link
                                to="/attendance/mark"
                                className="pending-request-card"
                            >
                                <span className="pending-icon">
                                    <FaCalendarCheck />
                                </span>
                                <span>
                                    <small>Employee records for today</small>
                                    <strong>
                                        {Number(summary.presentToday) +
                                            Number(summary.absentToday) +
                                            Number(summary.halfDayToday)}
                                    </strong>
                                </span>
                                <span className="pending-arrow">›</span>
                            </Link>
                        </article>
                        <article className="dashboard-panel deductions-panel">
                            <div className="panel-title-row">
                                <h2>Monthly deductions</h2>
                                <Link to="/salary-deductions/history">
                                    View history
                                </Link>
                            </div>
                            <strong className="monthly-deduction-value">
                                {Number(summary.monthlyDeductions).toLocaleString(
                                    "en-IN",
                                    {
                                        style: "currency",
                                        currency: "INR",
                                        maximumFractionDigits: 2
                                    }
                                )}
                            </strong>
                            <Link
                                className="deduction-action"
                                to="/salary-deductions/calculate"
                            >
                                Review deduction calculation
                            </Link>
                        </article>
                    </section>

                    <section className="dashboard-panel recent-attendance-panel">
                        <div className="panel-title-row">
                            <div>
                                <h2>Recent attendance</h2>
                                <p>Today&apos;s employee attendance records</p>
                            </div>
                            <div className="attendance-table-actions">
                                <label className="attendance-table-search">
                                    <FaSearch />
                                    <input
                                        aria-label="Search today's attendance"
                                        placeholder="Search attendance"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                    />
                                </label>
                                <Link to="/attendance/list">
                                    View attendance list
                                </Link>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Employee code</th>
                                        <th>Employee name</th>
                                        <th>Department</th>
                                        <th>Check in</th>
                                        <th>Check out</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleAttendance.length > 0 ? (
                                        visibleAttendance.map((item) => (
                                            <tr
                                                key={`${item.employee_code}-${item.attendance_date}`}
                                            >
                                                <td>{item.employee_code}</td>
                                                <td>{item.name}</td>
                                                <td>{item.department || "-"}</td>
                                                <td>{item.check_in || "-"}</td>
                                                <td>{item.check_out || "-"}</td>
                                                <td>
                                                    <span
                                                        className={
                                                            "status-badge " +
                                                            String(item.status)
                                                                .toLowerCase()
                                                                .replace(/\s+/g, "-")
                                                        }
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="empty-data">
                                                {search
                                                    ? "No attendance matches your search."
                                                    : "No attendance records for today."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
    );
}

export default Dashboard;
