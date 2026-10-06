import { Bell, LogOut, Menu, Search } from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/WorkspaceContext";

export default function Navbar() {
  const { currentUser, role, token, logout } = useAuth();

  const navigate = useNavigate();

  // ======================================================
  // SEARCH
  // ======================================================

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // ======================================================
  // LOGOUT
  // ======================================================

  const signOut = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  // ======================================================
  // OPEN SETTINGS / PROFILE
  // ======================================================

  const openProfile = () => {
    if (!role) {
      return;
    }

    navigate(`/${role}/settings`);
  };

  // ======================================================
  // GLOBAL SEARCH
  // ======================================================

  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const performSearch = async (query) => {
    if (!token || !role) {
      return;
    }

    try {
      setSearchLoading(true);
      setSearchOpen(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const results = [];

      // ==================================================
      // PROJECTS
      // ==================================================

      let projects = [];

      if (role === "employee") {
        const response = await fetch(
          "http://https://taskflow-apms.onrender.com/api/projects/my",
          {
            headers,
          },
        );

        if (response.ok) {
          projects = await response.json();
        }
      } else {
        const response = await fetch(
          "http://https://taskflow-apms.onrender.com/api/projects",
          {
            headers,
          },
        );

        if (response.ok) {
          projects = await response.json();
        }
      }

      projects.forEach((project) => {
        const name = project.name || "";
        const description = project.description || "";

        if (
          name.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        ) {
          results.push({
            type: "Project",
            title: name,
            subtitle: project.status || "Project",
            icon: "📁",
            path: `/${role}/projects/${project._id}`,
          });
        }
      });

      // ==================================================
      // TASKS
      // ==================================================

      let tasks = [];

      if (role === "employee") {
        const response = await fetch(
          "http://https://taskflow-apms.onrender.com/api/tasks/my",
          {
            headers,
          },
        );

        if (response.ok) {
          tasks = await response.json();
        }
      } else if (role === "manager" || role === "hr") {
        const response = await fetch(
          "http://https://taskflow-apms.onrender.com/api/tasks",
          {
            headers,
          },
        );

        if (response.ok) {
          tasks = await response.json();
        }
      }

      tasks.forEach((task) => {
        const title = task.title || "";
        const description = task.description || "";

        if (
          title.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        ) {
          results.push({
            type: "Task",
            title: title,
            subtitle: task.status || "Task",
            icon: "✓",
            path: role === "employee" ? `/${role}/my-tasks` : `/${role}/tasks`,
          });
        }
      });

      // ==================================================
      // EMPLOYEES
      // ==================================================

      if (role === "manager" || role === "hr") {
        const response = await fetch(
          "http://https://taskflow-apms.onrender.com/api/users/employees",
          {
            headers,
          },
        );

        if (response.ok) {
          const employees = await response.json();

          employees.forEach((employee) => {
            const name = employee.name || "";
            const email = employee.email || "";

            if (
              name.toLowerCase().includes(query) ||
              email.toLowerCase().includes(query)
            ) {
              results.push({
                type: "Employee",
                title: name,
                subtitle: email,
                icon: "👤",
                path: `/${role}/people`,
              });
            }
          });
        }
      }

      // ==================================================
      // HR USERS
      // ==================================================

      if (role === "manager") {
        const response = await fetch(
          "http://https://taskflow-apms.onrender.com/api/users/hr",
          {
            headers,
          },
        );

        if (response.ok) {
          const hrUsers = await response.json();

          hrUsers.forEach((hr) => {
            const name = hr.name || "";
            const email = hr.email || "";

            if (
              name.toLowerCase().includes(query) ||
              email.toLowerCase().includes(query)
            ) {
              results.push({
                type: "HR",
                title: name,
                subtitle: email,
                icon: "👤",
                path: `/${role}/people`,
              });
            }
          });
        }
      }

      setSearchResults(results.slice(0, 10));
    } catch (error) {
      console.error("Global search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // ======================================================
  // SELECT SEARCH RESULT
  // ======================================================

  const handleSearchResult = (result) => {
    setSearch("");
    setSearchResults([]);
    setSearchOpen(false);

    navigate(result.path);
  };

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* ==================================================
          LEFT SIDE
      ================================================== */}

      <div className="flex items-center gap-3">
        <Menu className="text-slate-600 lg:hidden" />

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="relative hidden w-72 sm:block">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
            <Search size={17} className="text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => {
                if (search.trim()) {
                  setSearchOpen(true);
                }
              }}
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {/* ==================================================
              SEARCH RESULTS
          ================================================== */}

          {searchOpen && (
            <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {searchLoading && (
                <div className="px-4 py-4 text-sm text-slate-500">
                  Searching...
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="px-4 py-4 text-sm text-slate-500">
                  No results found.
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.title}-${index}`}
                      type="button"
                      onClick={() => handleSearchResult(result)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-sm">
                        {result.icon}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {result.title}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {result.type} · {result.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="flex items-center gap-2 sm:gap-4">
        {/* ==================================================
            NOTIFICATIONS
        ================================================== */}

        <button
          type="button"
          onClick={() => role && navigate(`/${role}/notifications`)}
          title="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell size={20} />

          <i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600" />
        </button>

        {/* ==================================================
            USER PROFILE
        ================================================== */}

        <button
          type="button"
          onClick={openProfile}
          title="Open profile settings"
          className="flex items-center gap-2 border-l border-slate-200 pl-3 text-left transition hover:opacity-80 sm:pl-4"
        >
          <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
            {currentUser?.initials ||
              currentUser?.name?.charAt(0)?.toUpperCase() ||
              "U"}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">
              {currentUser?.name || "User"}
            </p>

            <p className="text-xs text-slate-500">
              {currentUser?.jobTitle || currentUser?.role || role || ""}
            </p>
          </div>
        </button>

        {/* ==================================================
            LOGOUT
        ================================================== */}

        <button
          type="button"
          onClick={signOut}
          title="Sign out"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} />

          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
