import { useEffect, useState } from "react";

import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock3,
  UserPlus,
  XCircle,
} from "lucide-react";

import { useAuth } from "../Context/WorkspaceContext";

export default function Activity() {
  const { token, role } = useAuth();

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ======================================================
  // MARK ACTIVITIES AS READ
  // ======================================================

  const markActivitiesAsRead = async () => {
    try {
      if (!token) return;

      const response = await fetch(
        "https://taskflow-apms.onrender.com/api/activities/mark-read",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();

        console.error("Mark activity read error:", data.message);

        return;
      }

      // Tell Sidebar to refresh unread count
      window.dispatchEvent(new Event("activityUpdated"));
    } catch (error) {
      console.error("Cannot mark activities as read:", error);
    }
  };

  // ======================================================
  // FETCH ACTIVITIES
  // ======================================================

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        return;
      }

      // --------------------------------------------------
      // IMPORTANT:
      // Mark activities as read FIRST
      // --------------------------------------------------

      await markActivitiesAsRead();

      // --------------------------------------------------
      // Then fetch activities
      // --------------------------------------------------

      const response = await fetch(
        "https://taskflow-apms.onrender.com/api/activities",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load activities.");

        return;
      }

      setActivities(data);

      // Refresh Sidebar again after activities load
      window.dispatchEvent(new Event("activityUpdated"));
    } catch (error) {
      console.error(error);

      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LOAD ACTIVITIES
  // ======================================================

  useEffect(() => {
    if (token) {
      fetchActivities();
    }
  }, [token]);

  // ======================================================
  // ICON
  // ======================================================

  const getActivityIcon = (activity) => {
    if (activity.action === "Approved Leave") {
      return <CheckCircle2 size={19} className="text-emerald-600" />;
    }

    if (activity.action === "Rejected Leave") {
      return <XCircle size={19} className="text-red-600" />;
    }

    if (
      activity.action === "Added Employee" ||
      activity.action === "Added HR"
    ) {
      return <UserPlus size={19} className="text-violet-600" />;
    }

    if (activity.action === "Applied for Leave") {
      return <Clock3 size={19} className="text-amber-600" />;
    }

    return <ActivityIcon size={19} className="text-slate-500" />;
  };

  // ======================================================
  // DATE FORMAT
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString();
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">Loading activity...</p>
      </div>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div>
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity</h1>

        <p className="mt-1 text-sm text-slate-500">
          Track important actions across your company workspace.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ACTIVITY LIST */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {activities.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
              <ActivityIcon size={22} />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-slate-800">
              No activity yet
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Important workspace actions will appear here.
            </p>
          </div>
        ) : (
          <div>
            {activities.map((activity) => {
              // ----------------------------------------
              // Correct read field based on role
              // ----------------------------------------

              const isUnread =
                role === "manager"
                  ? activity.managerRead === false
                  : role === "employee"
                    ? activity.employeeRead === false
                    : false;

              return (
                <div
                  key={activity._id}
                  className={`flex gap-4 border-b border-slate-100 p-5 last:border-0 ${
                    isUnread ? "bg-violet-50/40" : "bg-white"
                  }`}
                >
                  {/* ICON */}

                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100">
                    {getActivityIcon(activity)}
                  </div>

                  {/* CONTENT */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {activity.action}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {activity.description}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>

                    {/* USER ROLE */}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-violet-700">
                        {activity.userRole}
                      </span>

                      <span className="text-xs text-slate-400">
                        by {activity.userName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
