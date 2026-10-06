import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ListTodo,
  RefreshCw,
  FolderKanban,
  Users,
} from "lucide-react";

import { useWorkspace } from "../Context/WorkspaceContext";

const API_URL = "http://localhost:5000/api";

const statusColors = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-500",
  Review: "bg-amber-500",
  Completed: "bg-emerald-500",
};

const priorityColors = {
  Low: "bg-slate-400",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
};

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, className = "bg-violet-600" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${className}`}
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
        }}
      />
    </div>
  );
}

export default function Analytics() {
  const { role, token } = useWorkspace();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error("Please login again.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const taskEndpoint =
        role === "employee"
          ? `${API_URL}/tasks/my`
          : `${API_URL}/tasks`;

      const projectEndpoint =
        role === "employee"
          ? `${API_URL}/projects/my`
          : `${API_URL}/projects`;

      const requests = [
        fetch(taskEndpoint, {
          headers,
        }),
        fetch(projectEndpoint, {
          headers,
        }),
      ];

      if (role === "manager" || role === "hr") {
        requests.push(
          fetch(`${API_URL}/users/employees`, {
            headers,
          })
        );
      }

      const responses = await Promise.all(requests);

      for (const response of responses) {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));

          throw new Error(
            data.message || "Failed to load analytics data."
          );
        }
      }

      const taskData = await responses[0].json();
      const projectData = await responses[1].json();

      setTasks(Array.isArray(taskData) ? taskData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);

      if (role === "manager" || role === "hr") {
        const employeeData = await responses[2].json();

        setEmployees(
          Array.isArray(employeeData)
            ? employeeData
            : []
        );
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Analytics error:", err);

      setError(
        err.message || "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [role, token]);

  // ======================================================
  // TASK STATISTICS
  // ======================================================

  const statistics = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) => task.status === "Completed"
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const review = tasks.filter(
      (task) => task.status === "Review"
    ).length;

    const toDo = tasks.filter(
      (task) => task.status === "To Do"
    ).length;

    const today = new Date();

    const overdue = tasks.filter((task) => {
      if (
        task.status === "Completed" ||
        !task.dueDate
      ) {
        return false;
      }

      return new Date(task.dueDate) < today;
    }).length;

    const completionRate =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    return {
      total,
      completed,
      inProgress,
      review,
      toDo,
      overdue,
      completionRate,
    };
  }, [tasks]);

  // ======================================================
  // STATUS DATA
  // ======================================================

  const statusData = useMemo(() => {
    return [
      {
        name: "To Do",
        value: statistics.toDo,
        color: statusColors["To Do"],
      },
      {
        name: "In Progress",
        value: statistics.inProgress,
        color: statusColors["In Progress"],
      },
      {
        name: "Review",
        value: statistics.review,
        color: statusColors.Review,
      },
      {
        name: "Completed",
        value: statistics.completed,
        color: statusColors.Completed,
      },
    ];
  }, [statistics]);

  // ======================================================
  // PRIORITY DATA
  // ======================================================

  const priorityData = useMemo(() => {
    return [
      {
        name: "Low",
        value: tasks.filter(
          (task) => task.priority === "Low"
        ).length,
        color: priorityColors.Low,
      },
      {
        name: "Medium",
        value: tasks.filter(
          (task) => task.priority === "Medium"
        ).length,
        color: priorityColors.Medium,
      },
      {
        name: "High",
        value: tasks.filter(
          (task) => task.priority === "High"
        ).length,
        color: priorityColors.High,
      },
    ];
  }, [tasks]);

  // ======================================================
  // TEAM WORKLOAD
  // ======================================================

  const workload = useMemo(() => {
    if (role === "employee") {
      return [
        {
          id: "self",
          name: "My Tasks",
          total: tasks.length,
          completed: statistics.completed,
        },
      ];
    }

    return employees.map((employee) => {
      const employeeTasks = tasks.filter(
        (task) => {
          const assignedId =
            task.assignedTo?._id ||
            task.assignedTo;

          return (
            assignedId &&
            assignedId.toString() ===
              employee._id.toString()
          );
        }
      );

      const completedTasks =
        employeeTasks.filter(
          (task) => task.status === "Completed"
        ).length;

      return {
        id: employee._id,
        name: employee.name,
        total: employeeTasks.length,
        completed: completedTasks,
      };
    });
  }, [employees, tasks, role, statistics.completed]);

  // ======================================================
  // PROJECT PROGRESS
  // ======================================================

  const projectProgress = useMemo(() => {
    return projects.map((project) => {
      const projectId =
        project._id?.toString();

      const projectTasks = tasks.filter((task) => {
        const taskProjectId =
          task.project?._id ||
          task.project;

        return (
          taskProjectId &&
          taskProjectId.toString() === projectId
        );
      });

      let progress = 0;

      if (projectTasks.length > 0) {
        const completedTasks =
          projectTasks.filter(
            (task) => task.status === "Completed"
          ).length;

        progress = Math.round(
          (completedTasks /
            projectTasks.length) *
            100
        );
      } else if (project.status === "Completed") {
        progress = 100;
      } else if (
        project.status === "In Progress"
      ) {
        progress = 50;
      }

      return {
        ...project,
        totalTasks: projectTasks.length,
        progress,
      };
    });
  }, [projects, tasks]);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw
            size={20}
            className="animate-spin"
          />
          Loading analytics...
        </div>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">
          Unable to load analytics
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={loadAnalytics}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3
              size={24}
              className="text-violet-600"
            />

            <h1 className="text-2xl font-bold text-slate-900">
              Analytics
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Track task performance, project progress,
            workload and deadlines.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <StatCard
          title="Total Tasks"
          value={statistics.total}
          icon={ListTodo}
          description="All available tasks"
        />

        <StatCard
          title="Completed"
          value={statistics.completed}
          icon={CheckCircle2}
          description="Completed tasks"
        />

        <StatCard
          title="In Progress"
          value={statistics.inProgress}
          icon={Clock3}
          description="Currently working"
        />

        <StatCard
          title="In Review"
          value={statistics.review}
          icon={BarChart3}
          description="Waiting for review"
        />

        <StatCard
          title="Overdue"
          value={statistics.overdue}
          icon={AlertTriangle}
          description="Past due date"
        />

      </div>

      {/* ==================================================
          COMPLETION OVERVIEW
      ================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Task Status
              </h2>

              <p className="text-sm text-slate-500">
                Current distribution of your tasks
              </p>
            </div>

            <span className="text-2xl font-bold text-violet-600">
              {statistics.completionRate}%
            </span>
          </div>

          <div className="mt-6">
            <ProgressBar
              value={statistics.completionRate}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {statusData.map((item) => {
              const percentage =
                statistics.total > 0
                  ? Math.round(
                      (item.value /
                        statistics.total) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={item.name}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                    />

                    <span className="text-sm font-medium text-slate-600">
                      {item.name}
                    </span>
                  </div>

                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-2xl font-bold text-slate-900">
                      {item.value}
                    </span>

                    <span className="text-xs text-slate-400">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* PRIORITY */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-slate-900">
            Priority
          </h2>

          <p className="text-sm text-slate-500">
            Tasks grouped by priority
          </p>

          <div className="mt-6 space-y-5">

            {priorityData.map((item) => {
              const percentage =
                statistics.total > 0
                  ? Math.round(
                      (item.value /
                        statistics.total) *
                        100
                    )
                  : 0;

              return (
                <div key={item.name}>

                  <div className="mb-2 flex justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                      />

                      <span className="text-sm font-medium text-slate-600">
                        {item.name}
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-slate-800">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                </div>
              );
            })}

          </div>
        </div>

      </div>

      {/* ==================================================
          PROJECT PROGRESS
      ================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">
          <FolderKanban
            size={21}
            className="text-violet-600"
          />

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Project Progress
            </h2>

            <p className="text-sm text-slate-500">
              Progress calculated from completed tasks
            </p>
          </div>
        </div>

        {projectProgress.length === 0 ? (
          <div className="mt-8 rounded-xl bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              No projects available.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">

            {projectProgress.map((project) => (
              <div
                key={project._id}
                className="rounded-xl border border-slate-100 p-4"
              >

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {project.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {project.totalTasks} task
                      {project.totalTasks !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">

                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {project.status}
                    </span>

                    <span className="text-sm font-bold text-slate-800">
                      {project.progress}%
                    </span>

                  </div>

                </div>

                <div className="mt-3">
                  <ProgressBar
                    value={project.progress}
                  />
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* ==================================================
          TEAM WORKLOAD
      ================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <Users
            size={21}
            className="text-violet-600"
          />

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Team Workload
            </h2>

            <p className="text-sm text-slate-500">
              Tasks assigned to team members
            </p>
          </div>

        </div>

        {workload.length === 0 ? (
          <div className="mt-8 rounded-xl bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              No team workload data available.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {workload.map((member) => {

              const completion =
                member.total > 0
                  ? Math.round(
                      (member.completed /
                        member.total) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-slate-100 p-4"
                >

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {member.name
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {member.name}
                        </h3>

                        <p className="text-xs text-slate-400">
                          {member.total} task
                          {member.total !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>

                    </div>

                    <span className="text-sm font-bold text-slate-700">
                      {completion}%
                    </span>

                  </div>

                  <div className="mt-4">
                    <ProgressBar
                      value={completion}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>
                      {member.completed} completed
                    </span>

                    <span>
                      {member.total -
                        member.completed}{" "}
                      remaining
                    </span>
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* ==================================================
          EMPTY STATE
      ================================================== */}

      {tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

          <BarChart3
            size={36}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-lg font-semibold text-slate-700">
            No task data yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Create or assign tasks to start seeing
            analytics.
          </p>

        </div>
      )}

    </div>
  );
}