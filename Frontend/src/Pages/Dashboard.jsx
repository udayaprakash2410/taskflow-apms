import { useEffect, useState } from "react";

import {
  FolderKanban,
  CheckCircle2,
  Clock3,
  Users,
  ArrowUpRight,
  Plus,
  MoreHorizontal,
} from "lucide-react";

import { useWorkspace } from "../Context/WorkspaceContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const {
    role,
    currentUser,
    token,
  } = useWorkspace();

  const navigate = useNavigate();

  // ======================================================
  // REAL DATA
  // ======================================================

  const [projects, setProjects] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [recentActivities, setRecentActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ======================================================
  // FETCH DASHBOARD DATA
  // ======================================================

  useEffect(() => {
    if (!token || !role) {
      setLoading(false);
      return;
    }

    const fetchDashboardData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const headers = {
            Authorization: `Bearer ${token}`,
          };

          // ==================================================
          // PROJECTS
          // ==================================================

          let projectsData = [];

          if (role === "employee") {
            // Employee → only assigned projects
            const response =
              await fetch(
                "http://localhost:5000/api/projects/my",
                {
                  headers,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Failed to load projects."
              );
            }

            projectsData = Array.isArray(data)
              ? data
              : [];
          } else if (
            role === "manager" ||
            role === "hr"
          ) {
            // Manager + HR → all company projects
            const response =
              await fetch(
                "http://localhost:5000/api/projects",
                {
                  headers,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Failed to load projects."
              );
            }

            projectsData = Array.isArray(data)
              ? data
              : [];
          }

          setProjects(
            projectsData
          );

          // ==================================================
          // TASKS
          // ==================================================

          let tasksData = [];

          if (role === "employee") {
            // Employee → only assigned tasks
            const response =
              await fetch(
                "http://localhost:5000/api/tasks/my",
                {
                  headers,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Failed to load tasks."
              );
            }

            tasksData = Array.isArray(data)
              ? data
              : [];
          } else if (
            role === "manager" ||
            role === "hr"
          ) {
            // Manager + HR → all company tasks
            const response =
              await fetch(
                "http://localhost:5000/api/tasks",
                {
                  headers,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Failed to load tasks."
              );
            }

            tasksData = Array.isArray(data)
              ? data
              : [];
          }

          setTasks(tasksData);

          // ==================================================
          // EMPLOYEES
          // ==================================================

          if (
            role === "manager" ||
            role === "hr"
          ) {
            const response =
              await fetch(
                "http://localhost:5000/api/users/employees",
                {
                  headers,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Failed to load employees."
              );
            }

            setEmployees(data);
          }

          // ==================================================
          // REAL DASHBOARD ACTIVITIES
          // ==================================================

          const activityResponse =
            await fetch(
              "http://localhost:5000/api/activities/dashboard",
              {
                headers,
              }
            );

          const activityData =
            await activityResponse.json();

          if (!activityResponse.ok) {
            throw new Error(
              activityData.message ||
                "Failed to load activities."
            );
          }

          setRecentActivities(
            Array.isArray(activityData)
              ? activityData
              : []
          );
        } catch (error) {
          console.error(
            "Dashboard data error:",
            error
          );

          setError(
            error.message ||
              "Failed to load dashboard data."
          );
        } finally {
          setLoading(false);
        }
      };

    fetchDashboardData();
  }, [role, token]);

  // ======================================================
  // CURRENT USER
  // ======================================================

  const user = currentUser;

  // ======================================================
  // HEADING
  // ======================================================

  const heading =
    role === "hr"
      ? "People at a glance"
      : role === "employee"
        ? "Your work, at a glance"
        : "Delivery at a glance";

  // ======================================================
  // STATISTICS
  // ======================================================

  const activeProjects =
    projects.filter(
      (project) =>
        project.status ===
          "Planning" ||
        project.status ===
          "In Progress"
    ).length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "Completed"
    ).length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "In Progress"
    ).length;

  const teamMembers =
    role === "employee"
      ? 1
      : employees.length;

  const stats = [
    {
      label: "Active projects",
      value: activeProjects,
      icon: FolderKanban,
      color:
        "text-violet-600 bg-violet-50",
    },
    {
      label: "Tasks completed",
      value: completedTasks,
      icon: CheckCircle2,
      color:
        "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Tasks in progress",
      value: inProgressTasks,
      icon: Clock3,
      color:
        "text-amber-600 bg-amber-50",
    },
    {
      label: "Team members",
      value: teamMembers,
      icon: Users,
      color:
        "text-sky-600 bg-sky-50",
    },
  ];

  // ======================================================
  // MAIN ACTION
  // ======================================================

  const handleMainAction = () => {
    if (role === "hr") {
      navigate(
        "/hr/people?add=employee"
      );
      return;
    }

    if (role === "employee") {
      navigate(
        "/employee/tasks"
      );
      return;
    }

    navigate(
      "/manager/projects"
    );
  };

  // ======================================================
  // VIEW ALL
  // ======================================================

  const handleViewAll = () => {
    if (role === "employee") {
      navigate(
        "/employee/projects"
      );
      return;
    }

    navigate(
      `/${role}/projects`
    );
  };

  // ======================================================
  // PROJECT PROGRESS
  // ======================================================

  const getProjectProgress = (
    project
  ) => {
    const projectTasks =
      tasks.filter((task) => {
        const projectId =
          task.project?._id ||
          task.project;

        return (
          projectId?.toString() ===
          project._id?.toString()
        );
      });

    if (projectTasks.length > 0) {
      const completed =
        projectTasks.filter(
          (task) =>
            task.status ===
            "Completed"
        ).length;

      return Math.round(
        (completed /
          projectTasks.length) *
          100
      );
    }

    if (
      project.status ===
      "Completed"
    ) {
      return 100;
    }

    if (
      project.status ===
      "In Progress"
    ) {
      return 50;
    }

    return 0;
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ======================================================
  // FORMAT ACTIVITY TIME
  // ======================================================

  const formatActivityTime = (
    createdAt
  ) => {
    if (!createdAt) {
      return "";
    }

    const activityDate =
      new Date(createdAt);

    const now = new Date();

    const difference =
      now.getTime() -
      activityDate.getTime();

    const minutes = Math.floor(
      difference /
        (1000 * 60)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min${
        minutes === 1
          ? ""
          : "s"
      } ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hour${
        hours === 1
          ? ""
          : "s"
      } ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days} day${
        days === 1
          ? ""
          : "s"
      } ago`;
    }

    return formatDate(
      createdAt
    );
  };

  // ======================================================
  // ACTIVITY INITIALS
  // ======================================================

  const getInitials = (
    name
  ) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .map(
        (part) => part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="space-y-7">

        <section>
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-8 w-64 animate-pulse rounded bg-slate-200" />

          <div className="mt-2 h-4 w-52 animate-pulse rounded bg-slate-200" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-slate-100"
              />
            )
          )}
        </section>

      </div>
    );
  }

  // ======================================================
  // TODAY
  // ======================================================

  const today =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );

  // ======================================================
  // UPCOMING TASKS
  // ======================================================

  const upcomingTasks =
    tasks
      .filter(
        (task) =>
          task.status !==
          "Completed"
      )
      .sort(
        (a, b) =>
          new Date(
            a.dueDate
          ) -
          new Date(
            b.dueDate
          )
      )
      .slice(0, 4);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="space-y-7">

      {/* ==================================================
          HEADER
      ================================================== */}

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

        <div>

          <p className="text-sm font-medium text-violet-600">
            {today}
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Good morning,{" "}
            {user?.name
              ?.split(" ")[0] ||
              "User"}
            .
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {heading}
          </p>

        </div>

        <button
          onClick={
            handleMainAction
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Plus size={18} />

          {role === "hr"
            ? "Add employee"
            : role === "employee"
              ? "View my tasks"
              : "New project"}
        </button>

      </section>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon =
            stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >

              <div className="flex items-start justify-between">

                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${stat.color}`}
                >
                  <Icon size={20} />
                </div>

                <span className="flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight
                    size={14}
                  />
                  Live
                </span>

              </div>

              <p className="mt-5 text-2xl font-bold text-slate-900">
                {String(
                  stat.value
                ).padStart(
                  2,
                  "0"
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {stat.label}
              </p>

            </div>
          );
        })}

      </section>

      {/* ==================================================
          PROJECT PROGRESS + RECENT ACTIVITY
      ================================================== */}

      <section className="grid gap-6 xl:grid-cols-3">

        {/* PROJECT PROGRESS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="font-bold text-slate-900">
                {role === "employee"
                  ? "My projects"
                  : "Project progress"}
              </h2>

              <p className="text-sm text-slate-500">
                What needs attention this week
              </p>

            </div>

            <button
              onClick={
                handleViewAll
              }
              className="text-sm font-semibold text-violet-600"
            >
              View all
            </button>

          </div>

          <div className="space-y-5">

            {projects
              .slice(0, 3)
              .map(
                (project) => {

                  const progress =
                    getProjectProgress(
                      project
                    );

                  return (
                    <div
                      key={
                        project._id
                      }
                    >

                      <div className="mb-2 flex justify-between gap-3 text-sm">

                        <span className="font-medium text-slate-700">
                          {
                            project.name
                          }
                        </span>

                        <span className="text-slate-500">
                          {progress}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-violet-600"
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            {projects.length ===
              0 && (
              <p className="py-5 text-center text-sm text-slate-400">
                No projects available.
              </p>
            )}

          </div>

        </div>

        {/* RECENT ACTIVITY */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <h2 className="font-bold text-slate-900">
            Recent activity
          </h2>

          <div className="mt-5 space-y-5">

            {recentActivities.length >
            0 ? (
              recentActivities.map(
                (activity) => {

                  const name =
                    activity.userName ||
                    activity.user?.name ||
                    "User";

                  return (
                    <div
                      className="flex gap-3"
                      key={
                        activity._id
                      }
                    >

                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-bold text-violet-600">
                        {getInitials(
                          name
                        )}
                      </div>

                      <div>

                        <p className="text-sm leading-5 text-slate-700">
                          {activity.description ||
                            activity.action}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatActivityTime(
                            activity.createdAt
                          )}
                        </p>

                      </div>

                    </div>
                  );
                }
              )
            ) : (
              <p className="py-4 text-sm text-slate-400">
                No recent activity.
              </p>
            )}

          </div>

        </div>

      </section>

      {/* ==================================================
          UPCOMING TASKS
      ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white">

        <div className="flex items-center justify-between border-b border-slate-100 p-5">

          <div>

            <h2 className="font-bold text-slate-900">
              Upcoming tasks
            </h2>

            <p className="text-sm text-slate-500">
              Keep work moving forward
            </p>

          </div>

          <MoreHorizontal className="text-slate-400" />

        </div>

        <div className="divide-y divide-slate-100">

          {upcomingTasks.map(
            (task) => (
              <div
                key={task._id}
                className="flex flex-wrap items-center gap-3 p-4"
              >

                <span className="h-2 w-2 rounded-full bg-violet-500" />

                <p className="min-w-48 flex-1 text-sm font-medium text-slate-700">
                  {task.title}
                </p>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {task.status}
                </span>

                <span className="text-xs text-slate-400">
                  Due{" "}
                  {formatDate(
                    task.dueDate
                  )}
                </span>

              </div>
            )
          )}

          {upcomingTasks.length ===
            0 && (
            <div className="p-6 text-center text-sm text-slate-400">
              No upcoming tasks.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}
