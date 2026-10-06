import { useEffect, useRef, useState } from "react";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  X,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useWorkspace } from "../Context/WorkspaceContext";

export default function People() {
  const { role, token } = useWorkspace();
  const [searchParams] = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [hrUsers, setHrUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("employee");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Selected employee
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete loading
  const [deletingId, setDeletingId] = useState(null);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      setError("");

      const employeesResponse = await fetch(
        "http://https://taskflow-apms.onrender.com/api/users/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const employeesData = await employeesResponse.json();

      if (!employeesResponse.ok) {
        throw new Error(employeesData.message || "Failed to load employees");
      }

      setEmployees(employeesData);

      if (role === "manager") {
        const hrResponse = await fetch(
          "http://https://taskflow-apms.onrender.com/api/users/hr",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const hrData = await hrResponse.json();

        if (!hrResponse.ok) {
          throw new Error(hrData.message || "Failed to load HR");
        }

        setHrUsers(hrData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "manager" || role === "hr") {
      fetchPeople();
    }
  }, [role]);

  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);

    setName("");
    setEmail("");
    setPassword("");
    setJobTitle("");

    setMessage("");
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);

    setName("");
    setEmail("");
    setPassword("");
    setJobTitle("");
  };

  useEffect(() => {
    if (role === "hr" && searchParams.get("add") === "employee") {
      openForm("employee");
    }
  }, [role, searchParams]);

  const submitForm = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    let endpoint = "";

    if (formType === "employee") {
      if (role === "manager") {
        endpoint =
          "http://https://taskflow-apms.onrender.com/api/auth/manager/add-employee";
      } else if (role === "hr") {
        endpoint =
          "http://https://taskflow-apms.onrender.com/api/auth/hr/add-employee";
      }
    }

    if (formType === "hr" && role === "manager") {
      endpoint =
        "http://https://taskflow-apms.onrender.com/api/auth/manager/add-hr";
    }

    if (!endpoint) {
      setError("You are not allowed to perform this action.");
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          jobTitle: jobTitle.trim() || "Employee",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || `Failed to create ${formType}.`);
        return;
      }

      setMessage(
        formType === "hr"
          ? "HR added successfully."
          : "Employee added successfully.",
      );

      setName("");
      setEmail("");
      setPassword("");
      setJobTitle("");
      setShowForm(false);

      if (searchParams.get("add") === "employee") {
        window.history.replaceState({}, "", "/hr/people");
      }

      fetchPeople();
    } catch (err) {
      console.error(err);
      setError("Cannot connect to the server.");
    }
  };

  // ======================================================
  // VIEW EMPLOYEE
  // ======================================================

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  // ======================================================
  // EDIT EMPLOYEE
  // ======================================================

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);

    setName(employee.name);
    setEmail(employee.email);
    setJobTitle(employee.jobTitle || "Employee");

    setMessage("");
    setError("");

    setShowEditModal(true);
  };

  const updateEmployee = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/users/employees/${selectedEmployee._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            jobTitle: jobTitle.trim() || "Employee",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update employee.");
        return;
      }

      setShowEditModal(false);
      setSelectedEmployee(null);

      setName("");
      setEmail("");
      setJobTitle("");

      setMessage("Employee updated successfully.");

      fetchPeople();
    } catch (err) {
      console.error(err);

      setError("Cannot connect to the server.");
    }
  };

  // ======================================================
  // DELETE EMPLOYEE
  // ======================================================

  const handleDeleteEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(employee._id);
      setError("");
      setMessage("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/users/employees/${employee._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete employee.");
        return;
      }

      setMessage("Employee deleted successfully.");

      fetchPeople();
    } catch (err) {
      console.error(err);

      setError("Cannot connect to the server.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const value = search.toLowerCase();

    return (
      employee.name.toLowerCase().includes(value) ||
      employee.email.toLowerCase().includes(value)
    );
  });

  const filteredHR = hrUsers.filter((hr) => {
    const value = search.toLowerCase();

    return (
      hr.name.toLowerCase().includes(value) ||
      hr.email.toLowerCase().includes(value)
    );
  });

  if (role !== "manager" && role !== "hr") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900">People</h1>

        <p className="mt-2 text-sm text-slate-500">
          People management is not available for this role.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {role === "manager" ? "Team members" : "Employees"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {role === "manager"
              ? "Manage HR and employees in your organization."
              : "View and manage employees in your organization."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openForm("employee")}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <UserPlus size={17} />
            Add employee
          </button>

          {role === "manager" && (
            <button
              onClick={() => openForm("hr")}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
            >
              <UserPlus size={17} />
              Add HR
            </button>
          )}
        </div>
      </div>

      {/* MESSAGE */}

      {message && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ADD FORM */}

      {showForm && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">
            {formType === "employee" ? "Add new employee" : "Add new HR"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create login credentials for the new{" "}
            {formType === "employee" ? "employee" : "HR"}.
          </p>

          <form
            onSubmit={submitForm}
            className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <input
              type="text"
              placeholder={
                formType === "employee" ? "Employee name" : "HR name"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            />

            <input
              type="email"
              placeholder={
                formType === "employee" ? "Employee email" : "HR email"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            />

            <input
              type="password"
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            />

            <input
              type="text"
              placeholder={
                formType === "employee"
                  ? "Job role (e.g. Frontend Developer)"
                  : "Job role (e.g. HR Executive)"
              }
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            />

            <div className="flex gap-2 md:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                {formType === "employee" ? "Create employee" : "Create HR"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH + PEOPLE */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex w-full max-w-sm items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <span className="text-sm text-slate-500">
            {role === "manager"
              ? hrUsers.length + employees.length
              : employees.length}{" "}
            people
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading people...</div>
        ) : (
          <>
            {role === "manager" && (
              <div className="border-b border-slate-100">
                <div className="p-5">
                  <h2 className="font-bold text-slate-900">HR</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {hrUsers.length} HR member
                    {hrUsers.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <PeopleTable
                  users={filteredHR}
                  onView={handleViewEmployee}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                  deletingId={deletingId}
                />
              </div>
            )}

            <div>
              <div className="p-5">
                <h2 className="font-bold text-slate-900">Employees</h2>

                <p className="mt-1 text-sm text-slate-500">
                  {employees.length} employee
                  {employees.length !== 1 ? "s" : ""}
                </p>
              </div>

              <PeopleTable
                users={filteredEmployees}
                onView={handleViewEmployee}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
                deletingId={deletingId}
              />
            </div>
          </>
        )}
      </div>

      {/* VIEW MODAL */}

      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Employee details
              </h2>

              <button
                onClick={() => setShowViewModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Name
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedEmployee.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-slate-700">{selectedEmployee.email}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Job Role
                </p>
                <p className="mt-1 text-slate-700">
                  {selectedEmployee.jobTitle || "Employee"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  System Role
                </p>
                <span className="mt-1 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                  {selectedEmployee.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowViewModal(false)}
              className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}

      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Edit employee
              </h2>

              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={updateEmployee} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Job Role
                </label>

                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Save changes
                </button>

                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================
// PEOPLE TABLE
// ======================================================

function PeopleTable({ users, onView, onEdit, onDelete, deletingId }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);

  const openActionsMenu = (event, userId) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const menuWidth = 180;
    const menuHeight = 145;
    const gap = 8;

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;

    // Keep menu inside the screen horizontally
    if (left < 10) {
      left = 10;
    }

    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    // If there isn't enough space below,
    // show the menu above the button.
    if (top + menuHeight > window.innerHeight - 10) {
      top = rect.top - menuHeight - gap;
    }

    // Final safety check
    if (top < 10) {
      top = 10;
    }

    buttonRef.current = button;

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId((currentId) => (currentId === userId ? null : userId));
  };

  if (users.length === 0) {
    return (
      <div className="border-t border-slate-100 p-5 text-sm text-slate-500">
        No people found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3 font-semibold">Name</th>

            <th className="px-5 py-3 font-semibold">Email</th>

            <th className="px-5 py-3 font-semibold">Job Role</th>

            <th className="px-5 py-3 font-semibold">System Role</th>

            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => {
            const initials = user.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <tr key={user._id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                      {initials}
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {user.name}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {user.email}
                </td>

                <td className="px-5 py-4">
                  <span className="text-sm text-slate-600">
                    {user.jobTitle || "Employee"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                    {user.role}
                  </span>
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={(event) => openActionsMenu(event, user._id)}
                    aria-label={`Open actions for ${user.name}`}
                    aria-expanded={openMenuId === user._id}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ACTION MENU */}
      {openMenuId &&
        menuPosition &&
        (() => {
          const selectedUser = users.find((user) => user._id === openMenuId);

          if (!selectedUser) return null;

          return (
            <div
              ref={menuRef}
              className="fixed z-[100] w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              {/* VIEW */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null);
                  setMenuPosition(null);
                  onView(selectedUser);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Eye size={16} />
                <span>View employee</span>
              </button>

              {/* EDIT */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null);
                  setMenuPosition(null);
                  onEdit(selectedUser);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} />
                <span>Edit employee</span>
              </button>

              {/* DELETE */}
              <button
                type="button"
                disabled={deletingId === selectedUser._id}
                onClick={() => {
                  setOpenMenuId(null);
                  setMenuPosition(null);
                  onDelete(selectedUser);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />

                <span>
                  {deletingId === selectedUser._id
                    ? "Deleting..."
                    : "Delete employee"}
                </span>
              </button>
            </div>
          );
        })()}
    </div>
  );
}
