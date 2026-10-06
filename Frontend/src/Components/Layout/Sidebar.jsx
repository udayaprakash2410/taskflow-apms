import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Megaphone,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Palmtree,
  Settings,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../Context/WorkspaceContext";

const projectLinks = [
  {
    name: "Overview",
    path: "",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "My tasks",
    path: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Calendar",
    path: "/calendar",
    icon: CalendarDays,
  },
];

export default function Sidebar() {
  const { role, token } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);

  // ======================================================
  // NOTIFICATION UNREAD COUNT
  // ======================================================

  const fetchUnreadCount = async () => {
    try {
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/notifications/unread-count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Unread notification error:",
          data.message
        );
        return;
      }

      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error(
        "Cannot fetch unread notification count:",
        error
      );
    }
  };

  // ======================================================
  // ACTIVITY UNREAD COUNT
  // ======================================================

  const fetchUnreadActivityCount = async () => {
    try {
      if (!token) return;

      if (role !== "manager" && role !== "employee") {
        setUnreadActivityCount(0);
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/activities/unread-count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Unread activity error:",
          data.message
        );
        return;
      }

      setUnreadActivityCount(data.count || 0);
    } catch (error) {
      console.error(
        "Cannot fetch unread activity count:",
        error
      );
    }
  };

  // ======================================================
  // ANNOUNCEMENT UNREAD COUNT
  // ======================================================

  const fetchUnreadAnnouncementCount = async () => {
    try {
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/announcements/unread/count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Unread announcement error:",
          data.message
        );
        return;
      }

      setUnreadAnnouncementCount(data.count || 0);
    } catch (error) {
      console.error(
        "Cannot fetch unread announcement count:",
        error
      );
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    if (!token) return;

    fetchUnreadCount();
    fetchUnreadActivityCount();
    fetchUnreadAnnouncementCount();
  }, [token, role]);

  // ======================================================
  // NOTIFICATION UPDATE EVENT
  // ======================================================

  useEffect(() => {
    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      "notificationUpdated",
      handleNotificationUpdate
    );

    return () => {
      window.removeEventListener(
        "notificationUpdated",
        handleNotificationUpdate
      );
    };
  }, [token]);

  // ======================================================
  // ACTIVITY UPDATE EVENT
  // ======================================================

  useEffect(() => {
    const handleActivityUpdate = () => {
      fetchUnreadActivityCount();
    };

    window.addEventListener(
      "activityUpdated",
      handleActivityUpdate
    );

    return () => {
      window.removeEventListener(
        "activityUpdated",
        handleActivityUpdate
      );
    };
  }, [token, role]);

  // ======================================================
  // ANNOUNCEMENT UPDATE EVENT
  // ======================================================

  useEffect(() => {
    const handleAnnouncementUpdate = () => {
      fetchUnreadAnnouncementCount();
    };

    window.addEventListener(
      "announcementUpdated",
      handleAnnouncementUpdate
    );

    return () => {
      window.removeEventListener(
        "announcementUpdated",
        handleAnnouncementUpdate
      );
    };
  }, [token, role]);

  // ======================================================
  // SIDEBAR LINKS
  // ======================================================

  let links = [];

  // ------------------------------------------------------
  // EMPLOYEE
  // ------------------------------------------------------

  if (role === "employee") {
    links = [
      ...projectLinks,

      {
        name: "Activity",
        path: "/activity",
        icon: Activity,
        badge: unreadActivityCount,
      },

      {
        name: "Leave",
        path: "/leave",
        icon: Palmtree,
      },

      {
        name: "Announcements",
        path: "/announcements",
        icon: Megaphone,
        badge: unreadAnnouncementCount,
      },

      {
        name: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ];
  }

  // ------------------------------------------------------
  // HR
  // ------------------------------------------------------

  else if (role === "hr") {
    links = [
      {
        name: "Overview",
        path: "",
        icon: LayoutDashboard,
      },

      {
        name: "People",
        path: "/people",
        icon: UsersRound,
      },

      {
        name: "Leave requests",
        path: "/leave",
        icon: Palmtree,
      },

      {
        name: "Analytics",
        path: "/analytics",
        icon: BarChart3,
      },

      {
        name: "Announcements",
        path: "/announcements",
        icon: Megaphone,
        badge: unreadAnnouncementCount,
      },

      {
        name: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ];
  }

  // ------------------------------------------------------
  // MANAGER
  // ------------------------------------------------------

  else if (role === "manager") {
    links = [
      ...projectLinks,

      {
        name: "Team",
        path: "/people",
        icon: UsersRound,
      },

      {
        name: "Leave activity",
        path: "/leave",
        icon: Palmtree,
      },

      {
        name: "Activity",
        path: "/activity",
        icon: Activity,
        badge: unreadActivityCount,
      },

      {
        name: "Analytics",
        path: "/analytics",
        icon: BarChart3,
      },

      {
        name: "Announcements",
        path: "/announcements",
        icon: Megaphone,
        badge: unreadAnnouncementCount,
      },

      {
        name: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ];
  }

  // ======================================================
  // ROLE BASED PATH
  // ======================================================

  const link = (path) => `/${role}${path}`;

  // ======================================================
  // UI
  // ======================================================

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:bg-white lg:p-5">
      {/* BRAND */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <span className="text-lg font-bold">T</span>
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900">
            TaskFlow
          </h1>

          <p className="text-xs text-slate-500">
            Project management
          </p>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Signed-in workspace
        </p>

        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-sm font-semibold text-slate-800">
            {role === "manager"
              ? "Manager panel"
              : role === "hr"
              ? "HR panel"
              : "Employee panel"}
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="space-y-1">
        {links.map(
          ({
            name,
            path,
            icon: Icon,
            badge,
          }) => (
            <NavLink
              key={path}
              to={link(path)}
              end={path === ""}
              onClick={() => {
                if (name === "Activity") {
                  setUnreadActivityCount(0);
                }

              }}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-slate-900"
                    }
                  />

                  <span>{name}</span>

                  {/* ACTIVITY BADGE */}
                  {name === "Activity" &&
                    badge > 0 && (
                      <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}

                  {/* ANNOUNCEMENT BADGE */}
                  {name === "Announcements" &&
                    badge > 0 && (
                      <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-600">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                </>
              )}
            </NavLink>
          )
        )}
      </nav>

      {/* NOTIFICATIONS */}
      <div className="mt-3">
        <NavLink
          to={link("/notifications")}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Bell
                size={19}
                className={
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-900"
                }
              />

              <span>Notifications</span>

              {unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-600">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}