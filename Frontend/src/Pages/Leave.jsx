import { useEffect, useState } from "react";
import { useAuth } from "../Context/WorkspaceContext";

export default function Leave() {
  const { currentUser, token } = useAuth();

  const isEmployee = currentUser?.role === "employee";
  const isHR = currentUser?.role === "hr";
  const isManager = currentUser?.role === "manager";

  // Employee form
  const [form, setForm] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Leave data
  const [leaves, setLeaves] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // FETCH EMPLOYEE LEAVES
  // =========================

  const fetchMyLeaves = async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await fetch(
        "https://taskflow-apms.onrender.com/api/leaves/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load leaves");
        return;
      }

      setLeaves(data);
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    } finally {
      setPageLoading(false);
    }
  };

  // =========================
  // FETCH HR / MANAGER LEAVES
  // =========================

  const fetchAllLeaves = async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await fetch(
        "https://taskflow-apms.onrender.com/api/leaves",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load leave requests");
        return;
      }

      setLeaves(data);
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    } finally {
      setPageLoading(false);
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    if (!currentUser || !token) {
      return;
    }

    if (isEmployee) {
      fetchMyLeaves();
    } else if (isHR || isManager) {
      fetchAllLeaves();
    }
  }, [currentUser, token]);

  // =========================
  // EMPLOYEE FORM CHANGE
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // EMPLOYEE APPLY LEAVE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://taskflow-apms.onrender.com/api/leaves",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to apply leave");
        return;
      }

      setMessage("Leave request submitted successfully.");

      setForm({
        leaveType: "Casual Leave",
        startDate: "",
        endDate: "",
        reason: "",
      });

      await fetchMyLeaves();
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // APPROVE LEAVE
  // =========================

  const handleApprove = async (leaveId) => {
    setMessage("");
    setError("");
    setActionId(leaveId);

    try {
      const response = await fetch(
        `https://taskflow-apms.onrender.com/api/leaves/${leaveId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to approve leave");
        return;
      }

      setMessage("Leave approved successfully.");

      await fetchAllLeaves();
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    } finally {
      setActionId(null);
    }
  };

  // =========================
  // REJECT LEAVE
  // =========================

  const handleReject = async (leaveId) => {
    setMessage("");
    setError("");
    setActionId(leaveId);

    try {
      const response = await fetch(
        `https://taskflow-apms.onrender.com/api/leaves/${leaveId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reject leave");
        return;
      }

      setMessage("Leave rejected successfully.");

      await fetchAllLeaves();
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    } finally {
      setActionId(null);
    }
  };

  // =========================
  // STATUS BADGE
  // =========================

  const getStatusClass = (status) => {
    if (status === "Approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  // =========================
  // PAGE LOADING
  // =========================

  if (pageLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">Loading leave requests...</p>
      </div>
    );
  }

  // =========================================================
  // EMPLOYEE UI
  // =========================================================

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Apply for Leave
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Submit your leave request and track its status.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-800">
            New Leave Request
          </h2>

          {message && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Leave Type
              </label>

              <select
                name="leaveType"
                value={form.leaveType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="Casual Leave">Casual Leave</option>

                <option value="Sick Leave">Sick Leave</option>

                <option value="Emergency Leave">Emergency Leave</option>

                <option value="Earned Leave">Earned Leave</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                End Date
              </label>

              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reason
              </label>

              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Enter the reason for your leave..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Apply Leave"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-800">
            My Leave Requests
          </h2>

          {leaves.length === 0 ? (
            <p className="text-sm text-gray-500">No leave requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-3 py-3">Leave Type</th>

                    <th className="px-3 py-3">Start Date</th>

                    <th className="px-3 py-3">End Date</th>

                    <th className="px-3 py-3">Reason</th>

                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="border-b last:border-b-0">
                      <td className="px-3 py-4">{leave.leaveType}</td>

                      <td className="px-3 py-4">
                        {new Date(leave.startDate).toLocaleDateString()}
                      </td>

                      <td className="px-3 py-4">
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>

                      <td className="max-w-xs px-3 py-4">{leave.reason}</td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            leave.status,
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // HR UI
  // =========================================================

  if (isHR) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Leave Requests
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review and manage employee leave requests.
          </p>
        </div>

        {message && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Employee Leave Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Approve or reject pending requests.
              </p>
            </div>

            <div className="rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">
              {leaves.length} {leaves.length === 1 ? "Request" : "Requests"}
            </div>
          </div>

          {leaves.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm text-gray-500">No leave requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-3 py-3">Employee</th>

                    <th className="px-3 py-3">Leave Type</th>

                    <th className="px-3 py-3">Start Date</th>

                    <th className="px-3 py-3">End Date</th>

                    <th className="px-3 py-3">Reason</th>

                    <th className="px-3 py-3">Status</th>

                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="border-b last:border-b-0">
                      <td className="px-3 py-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {leave.employee?.name || leave.employeeName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {leave.employee?.email || "-"}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-sm text-gray-700">
                        {leave.leaveType}
                      </td>

                      <td className="px-3 py-4 text-sm text-gray-700">
                        {new Date(leave.startDate).toLocaleDateString()}
                      </td>

                      <td className="px-3 py-4 text-sm text-gray-700">
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>

                      <td className="max-w-[220px] px-3 py-4 text-sm text-gray-700">
                        {leave.reason}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            leave.status,
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        {leave.status === "Pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(leave._id)}
                              disabled={actionId === leave._id}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionId === leave._id
                                ? "Processing..."
                                : "Approve"}
                            </button>

                            <button
                              onClick={() => handleReject(leave._id)}
                              disabled={actionId === leave._id}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Decision completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // MANAGER UI
  // =========================================================

  if (isManager) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Leave Activity
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View employee leave requests and HR decisions.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-800">
            Leave Activity
          </h2>

          {leaves.length === 0 ? (
            <p className="text-sm text-gray-500">No leave requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-3 py-3">Employee</th>

                    <th className="px-3 py-3">Leave Type</th>

                    <th className="px-3 py-3">Dates</th>

                    <th className="px-3 py-3">Reason</th>

                    <th className="px-3 py-3">Status</th>

                    <th className="px-3 py-3">Decided By</th>

                    <th className="px-3 py-3">Decision Date</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="border-b last:border-b-0">
                      <td className="px-3 py-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {leave.employee?.name || leave.employeeName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {leave.employee?.email || "-"}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-sm">{leave.leaveType}</td>

                      <td className="px-3 py-4 text-sm">
                        {new Date(leave.startDate).toLocaleDateString()} -{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>

                      <td className="max-w-[220px] px-3 py-4 text-sm">
                        {leave.reason}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            leave.status,
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm">
                        {leave.decidedByName || "-"}
                      </td>

                      <td className="px-3 py-4 text-sm">
                        {leave.decisionDate
                          ? new Date(leave.decisionDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
