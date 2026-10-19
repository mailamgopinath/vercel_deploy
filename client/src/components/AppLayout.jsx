import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import {
    FaBars,
    FaCalendarCheck,
    FaChartBar,
    FaCog,
    FaDatabase,
    FaFileAlt,
    FaSignOutAlt,
    FaTachometerAlt,
    FaUsers
} from "react-icons/fa";
import "../styles/Dashboard.css";

const navigation = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: <FaTachometerAlt />
    },
    {
        label: "Employees",
        path: "/employees",
        icon: <FaUsers />
    },
    {
        label: "Attendance",
        path: "/attendance/mark",
        icon: <FaCalendarCheck />
    },
    {
        label: "Attendance list",
        path: "/attendance/list",
        icon: <FaFileAlt />
    },
    {
        label: "Monthly report",
        path: "/reports/monthly-attendance",
        icon: <FaChartBar />
    },
    {
        label: "Salary deductions",
        path: "/salary-deductions/calculate",
        icon: <FaDatabase />
    },
    {
        label: "Settings",
        path: "/settings/deductions",
        icon: <FaCog />
    }
];

const pageTitles = {
    "/dashboard": "Dashboard",
    "/employees": "Employees",
    "/attendance/mark": "Attendance",
    "/attendance/list": "Attendance list",
    "/reports/monthly-attendance": "Monthly attendance report",
    "/salary-deductions/calculate": "Salary deduction calculator",
    "/salary-deductions/history": "Deduction history",
    "/settings/deductions": "Deduction settings"
};

const getTokenExpiration = (token) => {
    try {
        const payload = token.split(".")[1];
        if (!payload) {
            return null;
        }
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(
            window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
        );
        return Number.isFinite(decoded.exp) ? decoded.exp * 1000 : null;
    } catch {
        return null;
    }
};

function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const pageTitle = pageTitles[location.pathname] || "Employee tracker";

    useEffect(() => {
        const endSession = () => {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            navigate("/login", {
                replace: true,
                state: { sessionExpired: true }
            });
        };

        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const expiresAt = token ? getTokenExpiration(token) : null;
        let expiryTimer;

        if (!expiresAt || expiresAt <= Date.now()) {
            endSession();
        } else {
            expiryTimer = window.setTimeout(
                endSession,
                Math.min(expiresAt - Date.now(), 2_147_000_000)
            );
        }

        const interceptorId = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    endSession();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            window.clearTimeout(expiryTimer);
            api.interceptors.response.eject(interceptorId);
        };
    }, [navigate]);
    const logout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/login", { replace: true });
    };

    return (
        <div className="dashboard-shell">
            {sidebarOpen && (
                <button
                    className="sidebar-backdrop"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="brand-mark">
                        <FaUsers />
                    </div>
                    <span>People</span>
                    <button
                        className="sidebar-collapse"
                        aria-label="Close navigation"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <FaBars />
                    </button>
                </div>

                <p className="sidebar-caption">WORKSPACE</p>
                <nav className="sidebar-nav" aria-label="Main navigation">
                    {navigation.map((item) => {
                        const active =
                            location.pathname === item.path ||
                            (item.path === "/salary-deductions/calculate" &&
                                location.pathname ===
                                    "/salary-deductions/history");
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={active ? "active" : ""}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="sidebar-nav-icon">
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="sidebar-footer">
                    <div className="sidebar-help-icon">?</div>
                    <div>
                        <strong>Need help?</strong>
                        <span>Manage your workspace</span>
                    </div>
                </div>
            </aside>

            <div className="dashboard-main">
                <header className="dashboard-topbar">
                    <button
                        className="mobile-menu-button"
                        aria-label="Open navigation"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <FaBars />
                    </button>
                    <div className="topbar-page-title">{pageTitle}</div>
                    <div className="topbar-actions">
                        <button
                            className="profile-button"
                            onClick={logout}
                            title="Log out"
                            aria-label="Log out"
                        >
                            <FaSignOutAlt />
                        </button>
                    </div>
                </header>
                {children}
            </div>
        </div>
    );
}

export default AppLayout;
