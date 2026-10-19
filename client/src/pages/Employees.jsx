import React, { useCallback, useEffect, useState } from "react";
import api, { API_ORIGIN } from "../api";
import { Link } from "react-router-dom";
import { FaEdit, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import "../styles/Employees.css";

const API_URL = "/employees";
const emptyForm = {
    employee_code: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    gender: "",
    date_of_joining: "",
    basic_monthly_salary: "0",
    status: "active"
};

function getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        search: "",
        department: "",
        status: "all"
    });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [profileImage, setProfileImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const loadEmployees = useCallback(async () => {
        try {
            const response = await api.get(API_URL, {
                headers: { Authorization: `Bearer ${getToken()}` },
                params: { ...filters, page, limit: 10 }
            });
            setEmployees(response.data.data.employees);
            setPagination(response.data.data.pagination);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to load employees."
            );
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    useEffect(() => {
        api
            .get(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            })
            .then((response) => setDepartments(response.data.data))
            .catch((requestError) => {
                setError(
                    requestError.response?.data?.message ||
                        "Unable to load department filters."
                );
            });
    }, []);

    const resetForm = () => {
        setForm(emptyForm);
        setProfileImage(null);
        setEditingId(null);
    };

    const startEditing = async (id) => {
        setError("");
        try {
            const response = await api.get(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const employee = response.data.data;
            setForm({
                employee_code: employee.employee_code || "",
                name: employee.name || "",
                email: employee.email || "",
                phone: employee.phone || "",
                department: employee.department || "",
                designation: employee.designation || "",
                gender: employee.gender || "",
                date_of_joining: employee.date_of_joining
                    ? String(employee.date_of_joining).slice(0, 10)
                    : "",
                basic_monthly_salary: String(
                    employee.basic_monthly_salary ?? 0
                ),
                status: employee.status
            });
            setEditingId(id);
            setProfileImage(null);
            setNotice("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to load employee details."
            );
        }
    };

    const saveEmployee = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");
        const body = new FormData();
        Object.entries(form).forEach(([key, value]) => body.append(key, value));
        if (profileImage) {
            body.append("profileImage", profileImage);
        }

        try {
            const config = {
                headers: { Authorization: `Bearer ${getToken()}` }
            };
            if (editingId) {
                await api.put(`${API_URL}/${editingId}`, body, config);
                setNotice("Employee updated successfully.");
            } else {
                await api.post(API_URL, body, config);
                setNotice("Employee added successfully.");
            }
            resetForm();
            setLoading(true);
            await loadEmployees();
            const response = await api.get(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setDepartments(response.data.data);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to save employee."
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteEmployee = async (employee) => {
        if (
            !window.confirm(
                `Mark ${employee.name} as deleted? Their attendance history will be kept.`
            )
        ) {
            return;
        }

        setError("");
        setNotice("");
        try {
            await api.delete(`${API_URL}/${employee.id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setNotice(`${employee.name} was marked as deleted.`);
            setSelectedEmployee(null);
            setLoading(true);
            await loadEmployees();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Unable to delete employee."
            );
        }
    };

    const changeFilter = (event) => {
        setError("");
        setFilters((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
        setLoading(true);
        setPage(1);
    };

    const changePage = (nextPage) => {
        setError("");
        setLoading(true);
        setPage(nextPage);
    };

    return (
        <main className="employees-page">
            <header className="employees-header">
                <div>
                    <p className="employees-eyebrow">PEOPLE</p>
                    <h1>Employee management</h1>
                    <p>Manage employee profiles while preserving attendance history.</p>
                </div>
                <nav className="employees-nav">
                    <Link to="/dashboard">Dashboard</Link>
                    <button
                        className="employee-primary-button"
                        onClick={() => {
                            resetForm();
                            setError("");
                            setNotice("");
                        }}
                    >
                        <FaPlus /> Add employee
                    </button>
                </nav>
            </header>

            {error && <div className="employee-alert error">{error}</div>}
            {notice && <div className="employee-alert success">{notice}</div>}

            <section className="employee-panel">
                <div className="employee-toolbar">
                    <input
                        aria-label="Search employees"
                        name="search"
                        placeholder="Search name or employee code"
                        value={filters.search}
                        onChange={changeFilter}
                    />
                    <select
                        aria-label="Filter by department"
                        name="department"
                        value={filters.department}
                        onChange={changeFilter}
                    >
                        <option value="">All departments</option>
                        {departments.map((department) => (
                            <option key={department} value={department}>
                                {department}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Filter by status"
                        name="status"
                        value={filters.status}
                        onChange={changeFilter}
                    >
                        <option value="all">Active and inactive</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="deleted">Deleted</option>
                    </select>
                </div>

                <div className="table-responsive">
                    <table className="table employee-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Code</th>
                                <th>Department</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="employee-empty">
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="employee-empty">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td>
                                            <div className="employee-name-cell">
                                                {employee.profile_image ? (
                                                    <img
                                                        src={`${API_ORIGIN}${employee.profile_image}`}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <span className="employee-avatar">
                                                        {employee.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                                <span>{employee.name}</span>
                                            </div>
                                        </td>
                                        <td>{employee.employee_code}</td>
                                        <td>{employee.department}</td>
                                        <td>{employee.email || "-"}</td>
                                        <td>
                                            <span
                                                className={`employee-status ${employee.status}`}
                                            >
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="employee-actions">
                                                <button
                                                    title="View details"
                                                    aria-label="View details"
                                                    onClick={() =>
                                                        setSelectedEmployee(employee)
                                                    }
                                                >
                                                    <FaEye />
                                                </button>
                                                {employee.status !== "deleted" && (
                                                    <>
                                                        <button
                                                            title="Edit employee"
                                                            aria-label="Edit employee"
                                                            onClick={() =>
                                                                startEditing(employee.id)
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="delete-action"
                                                            title="Soft delete employee"
                                                            aria-label="Delete employee"
                                                            onClick={() =>
                                                                deleteEmployee(employee)
                                                            }
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="employee-pagination">
                    <span>
                        {pagination.total} employee
                        {pagination.total === 1 ? "" : "s"}
                    </span>
                    <div>
                        <button
                            disabled={page <= 1}
                            onClick={() => changePage(page - 1)}
                        >
                            Previous
                        </button>
                        <span>
                            Page {pagination.totalPages ? page : 0} of{" "}
                            {pagination.totalPages}
                        </span>
                        <button
                            disabled={page >= pagination.totalPages}
                            onClick={() => changePage(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </footer>
            </section>

            {(editingId !== null || notice === "") && (
                <section className="employee-panel employee-form-panel">
                    <div className="employee-section-heading">
                        <div>
                            <p className="employees-eyebrow">
                                {editingId ? "UPDATE PROFILE" : "NEW PROFILE"}
                            </p>
                            <h2>{editingId ? "Edit employee" : "Add employee"}</h2>
                        </div>
                        {editingId !== null && (
                            <button className="employee-cancel" onClick={resetForm}>
                                Cancel edit
                            </button>
                        )}
                    </div>
                    <form className="employee-form" onSubmit={saveEmployee}>
                        <label>
                            Employee code *
                            <input
                                required
                                maxLength="50"
                                value={form.employee_code}
                                onChange={(event) =>
                                    setForm({ ...form, employee_code: event.target.value })
                                }
                            />
                        </label>
                        <label>
                            Full name *
                            <input
                                required
                                value={form.name}
                                onChange={(event) =>
                                    setForm({ ...form, name: event.target.value })
                                }
                            />
                        </label>
                        <label>
                            Email *
                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    setForm({ ...form, email: event.target.value })
                                }
                            />
                        </label>
                        <label>
                            Phone
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    setForm({ ...form, phone: event.target.value })
                                }
                            />
                        </label>
                        <label>
                            Department *
                            <input
                                required
                                list="department-options"
                                value={form.department}
                                onChange={(event) =>
                                    setForm({ ...form, department: event.target.value })
                                }
                            />
                            <datalist id="department-options">
                                {departments.map((department) => (
                                    <option key={department} value={department} />
                                ))}
                            </datalist>
                        </label>
                        <label>
                            Designation
                            <input
                                value={form.designation}
                                onChange={(event) =>
                                    setForm({ ...form, designation: event.target.value })
                                }
                            />
                        </label>
                        <label>
                            Gender
                            <select
                                value={form.gender}
                                onChange={(event) =>
                                    setForm({ ...form, gender: event.target.value })
                                }
                            >
                                <option value="">Select</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">
                                    Prefer not to say
                                </option>
                            </select>
                        </label>
                        <label>
                            Date of joining
                            <input
                                type="date"
                                value={form.date_of_joining}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        date_of_joining: event.target.value
                                    })
                                }
                            />
                        </label>
                        <label>
                            Basic monthly salary
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.basic_monthly_salary}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        basic_monthly_salary: event.target.value
                                    })
                                }
                            />
                        </label>
                        <label>
                            Status
                            <select
                                value={form.status}
                                onChange={(event) =>
                                    setForm({ ...form, status: event.target.value })
                                }
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </label>
                        <label>
                            Profile image (JPEG, PNG, WebP; max 2 MB)
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) =>
                                    setProfileImage(event.target.files?.[0] || null)
                                }
                            />
                        </label>
                        <div className="employee-form-actions">
                            <button
                                className="employee-primary-button"
                                type="submit"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                      ? "Save changes"
                                      : "Create employee"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {selectedEmployee && (
                <div
                    className="employee-modal-backdrop"
                    onClick={() => setSelectedEmployee(null)}
                >
                    <section
                        className="employee-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employee-details-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            className="employee-modal-close"
                            aria-label="Close details"
                            onClick={() => setSelectedEmployee(null)}
                        >
                            ×
                        </button>
                        <h2 id="employee-details-title">
                            {selectedEmployee.name}
                        </h2>
                        <p>{selectedEmployee.employee_code}</p>
                        <dl>
                            {[
                                ["Email", selectedEmployee.email],
                                ["Phone", selectedEmployee.phone],
                                ["Department", selectedEmployee.department],
                                ["Designation", selectedEmployee.designation],
                                ["Gender", selectedEmployee.gender],
                                [
                                    "Date of joining",
                                    selectedEmployee.date_of_joining
                                        ? String(
                                              selectedEmployee.date_of_joining
                                          ).slice(0, 10)
                                        : ""
                                ],
                                [
                                    "Monthly salary",
                                    selectedEmployee.basic_monthly_salary
                                ],
                                ["Status", selectedEmployee.status]
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value || "-"}</dd>
                                </div>
                            ))}
                        </dl>
                        {selectedEmployee.profile_image && (
                            <img
                                className="employee-detail-image"
                                src={`${API_ORIGIN}${selectedEmployee.profile_image}`}
                                alt={`${selectedEmployee.name} profile`}
                            />
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}

export default Employees;
