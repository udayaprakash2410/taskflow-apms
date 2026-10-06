import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from "../Context/WorkspaceContext";

export default function Notifications() {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://https://taskflow-apms.onrender.com/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load notifications.");
        return;
      }

      setNotifications(data);
    } catch (error) {
      console.error(error);

      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD ON PAGE OPEN
  // ==========================================

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  // ==========================================
  // MARK ONE AS READ
  // ==========================================

  const markAsRead = async (notificationId) => {
    try {
      setMarkingId(notificationId);

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to mark notification as read.");
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error) {
      console.error(error);

      setError("Cannot connect to server.");
    } finally {
      setMarkingId(null);
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      setError("");

      const response = await fetch(
        "http://https://taskflow-apms.onrender.com/api/notifications/read-all",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to mark all notifications as read.");
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error) {
      console.error(error);

      setError("Cannot connect to server.");
    } finally {
      setMarkingAll(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString();
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">Loading notifications...</p>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>

          <p className="mt-1 text-sm text-slate-500">
            Stay up to date with your work.
          </p>
        </div>

        {notifications.some((notification) => !notification.isRead) && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={17} />

            {markingAll ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Notifications */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {notifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
              <Bell size={22} />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-slate-800">
              No notifications
            </h2>

            <p className="mt-1 text-sm text-slate-500">You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex gap-4 border-b border-slate-100 p-5 last:border-0 ${
                !notification.isRead ? "bg-violet-50/30" : "bg-white"
              }`}
            >
              {/* Icon */}
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  !notification.isRead
                    ? "bg-violet-100 text-violet-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Bell size={18} />
              </span>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? "font-semibold text-slate-800"
                          : "font-medium text-slate-700"
                      }`}
                    >
                      {notification.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                  )}
                </div>

                {/* Mark as read */}
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    disabled={markingId === notification._id}
                    className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-50"
                  >
                    {markingId === notification._id
                      ? "Marking..."
                      : "Mark as read"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
