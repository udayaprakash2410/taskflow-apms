import { useEffect, useState } from "react";
import {
  CalendarClock,
  ListFilter,
  MessageSquare,
  Paperclip,
  Plus,
  X,
} from "lucide-react";

import { useWorkspace } from "../Context/WorkspaceContext";

const style = {
  "To Do": "bg-slate-100 text-slate-600",
  "In Progress": "bg-blue-50 text-blue-700",
  Review: "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

const statuses = [
  "To Do",
  "In Progress",
  "Review",
  "Completed",
];

export default function MyTasks() {
  const { role, currentUser, token } = useWorkspace();

  const [workItems, setWorkItems] = useState([]);

  // Real employee tasks from MongoDB
  const [employeeTasks, setEmployeeTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [savingTask, setSavingTask] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "Medium",
    status: "Not Started",
    startDate: "",
    dueDate: "",
  });

  const filteredWorkItems = workItems.filter((task) => {
    const assigneeId = task.assignedTo?._id || task.assignedTo || "";
    const createTask = async (event) => {
    event.preventDefault();

    if (
      !taskForm.title.trim() ||
      !taskForm.description.trim() ||
      !taskForm.projectId ||
      !taskForm.startDate ||
      !taskForm.dueDate
    ) {
      setError("Please fill all required task fields.");
      return;
    }

    if (new Date(taskForm.dueDate) < new Date(taskForm.startDate)) {
      setError("Due date cannot be before start date.");
      return;
    }

    try {
      setSavingTask(true);
      setError("");
      setNotice("");

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task.");
      }

      let createdTask = data.task;

      if (selectedAssignee) {
        const assignResponse = await fetch(
          `http://localhost:5000/api/tasks/${createdTask._id}/assign`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ employeeId: selectedAssignee }),
          }
        );

        const assignData = await assignResponse.json();

        if (!assignResponse.ok) {
          throw new Error(assignData.message || "Task assignment failed.");
        }

        createdTask = assignData.task;
      }

      setWorkItems((items) => [createdTask, ...items]);
      setTaskForm({
        title: "",
        description: "",
        projectId: "",
        priority: "Medium",
        status: "Not Started",
        startDate: "",
        dueDate: "",
      });
      setSelectedAssignee("");
      setShowTaskForm(false);
      setNotice("Task created successfully.");
    } catch (err) {
      console.error("Create task error:", err);
      setError(err.message || "Failed to create task.");
    } finally {
      setSavingTask(false);
    }
  };

  const clearFilters = () => {
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterAssignee("All");
  };

  return (
      (filterStatus === "All" || task.status === filterStatus) &&
      (filterPriority === "All" || task.priority === filterPriority) &&
      (filterAssignee === "All" ||
        assigneeId.toString() === filterAssignee.toString())
    );
  });

  // ======================================================
  // EMPLOYEE → GET MY TASKS
  // ======================================================

  useEffect(() => {
    if (
      !token ||
      (role !== "employee" && role !== "manager")
    ) {
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          role === "employee"
            ? "http://localhost:5000/api/tasks/my"
            : "http://localhost:5000/api/tasks",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load tasks."
          );
        }

        if (role === "employee") {
          setEmployeeTasks(data);
          setWorkItems([]);
        } else {
          setWorkItems(data);
          setEmployeeTasks([]);
        }
      } catch (error) {
        console.error("Get tasks error:", error);

        setError(
          error.message || "Failed to load tasks."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    if (role === "manager") {
      Promise.all([
        fetch("http://localhost:5000/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/users/employees", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
        .then(async ([projectResponse, employeeResponse]) => {
          const projectData = await projectResponse.json();
          const employeeData = await employeeResponse.json();
          if (projectResponse.ok) setProjects(projectData);
          if (employeeResponse.ok) setEmployees(employeeData);
        })
        .catch((err) => console.error("Manager task data error:", err));
    }
  }, [role, token]);

  // ======================================================
  // EMPLOYEE → UPDATE TASK STATUS
  // ======================================================

  const updateEmployeeTaskStatus = async (
    taskId,
    status
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setNotice("");
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update task status."
        );
      }

      // Update the task returned by backend
      setEmployeeTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === taskId ? data.task : task
        )
      );

      setNotice("Task status updated successfully.");
    } catch (error) {
      console.error(
        "Update task status error:",
        error
      );

      setError(
        error.message ||
          "Failed to update task status."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();

    if (
      !taskForm.title.trim() ||
      !taskForm.description.trim() ||
      !taskForm.projectId ||
      !taskForm.startDate ||
      !taskForm.dueDate
    ) {
      setError("Please fill all required task fields.");
      return;
    }

    if (new Date(taskForm.dueDate) < new Date(taskForm.startDate)) {
      setError("Due date cannot be before start date.");
      return;
    }

    try {
      setSavingTask(true);
      setError("");
      setNotice("");

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task.");
      }

      let createdTask = data.task;

      if (selectedAssignee) {
        const assignResponse = await fetch(
          `http://localhost:5000/api/tasks/${createdTask._id}/assign`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ employeeId: selectedAssignee }),
          }
        );

        const assignData = await assignResponse.json();

        if (!assignResponse.ok) {
          throw new Error(assignData.message || "Task assignment failed.");
        }

        createdTask = assignData.task;
      }

      setWorkItems((items) => [createdTask, ...items]);
      setTaskForm({
        title: "",
        description: "",
        projectId: "",
        priority: "Medium",
        status: "Not Started",
        startDate: "",
        dueDate: "",
      });
      setSelectedAssignee("");
      setShowTaskForm(false);
      setNotice("Task created successfully.");
    } catch (err) {
      console.error("Create task error:", err);
      setError(err.message || "Failed to create task.");
    } finally {
      setSavingTask(false);
    }
  };

  const clearFilters = () => {
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterAssignee("All");
  };

  return (
    <div>
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {role === "employee" ? "My tasks" : "Tasks"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Stay focused on what matters most.
          </p>
        </div>

        <div className="relative flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilter((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"
          >
            <ListFilter size={17} />
            Filter
          </button>

          {role === "manager" && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setNotice("");
                setShowTaskForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <Plus size={17} />
              New task
            </button>
          )}

          {showFilter && (
            <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Filter tasks</h3>
                <button
                  type="button"
                  onClick={() => setShowFilter(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <label className="mb-3 block text-xs font-semibold text-slate-500">
                Status
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                >
                  <option value="All">All</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              <label className="mb-3 block text-xs font-semibold text-slate-500">
                Priority
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                >
                  <option value="All">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label className="mb-3 block text-xs font-semibold text-slate-500">
                Assignee
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                >
                  <option value="All">All</option>
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          SUCCESS MESSAGE
      ================================================== */}

      {notice && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}

      {/* ==================================================
          ERROR MESSAGE
      ================================================== */}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ==================================================
          EMPLOYEE LOADING
      ================================================== */}

      {loading && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            Loading tasks...
          </p>
        </div>
      )}

      {/* ==================================================
          EMPLOYEE EMPTY
      ================================================== */}

      {role === "employee" &&
        !loading &&
        employeeTasks.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              No tasks assigned
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Tasks assigned to you will appear here.
            </p>
          </div>
        )}

      {role === "manager" &&
        !loading &&
        filteredWorkItems.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              No tasks available
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Create a task to start tracking project work.
            </p>
          </div>
        )}

      {/* ==================================================
          TASK TABLE
      ================================================== */}

      {((role === "employee" &&
        employeeTasks.length > 0) ||
        (role === "manager" &&
          filteredWorkItems.length > 0)) && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">

          {/* TABLE HEADER */}

          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 md:grid">
            <span>Task</span>
            <span>Assignee</span>
            <span>Status</span>
            <span>Due date</span>
          </div>

          {/* ==================================================
              EMPLOYEE TASKS
          ================================================== */}

          {role === "employee" &&
            employeeTasks.map((task) => {
              const employeeName =
                task.assignedToName ||
                task.assignedTo?.name ||
                currentUser?.name ||
                "You";

              const createTask = async (event) => {
    event.preventDefault();

    if (
      !taskForm.title.trim() ||
      !taskForm.description.trim() ||
      !taskForm.projectId ||
      !taskForm.startDate ||
      !taskForm.dueDate
    ) {
      setError("Please fill all required task fields.");
      return;
    }

    if (new Date(taskForm.dueDate) < new Date(taskForm.startDate)) {
      setError("Due date cannot be before start date.");
      return;
    }

    try {
      setSavingTask(true);
      setError("");
      setNotice("");

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task.");
      }

      let createdTask = data.task;

      if (selectedAssignee) {
        const assignResponse = await fetch(
          `http://localhost:5000/api/tasks/${createdTask._id}/assign`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ employeeId: selectedAssignee }),
          }
        );

        const assignData = await assignResponse.json();

        if (!assignResponse.ok) {
          throw new Error(assignData.message || "Task assignment failed.");
        }

        createdTask = assignData.task;
      }

      setWorkItems((items) => [createdTask, ...items]);
      setTaskForm({
        title: "",
        description: "",
        projectId: "",
        priority: "Medium",
        status: "Not Started",
        startDate: "",
        dueDate: "",
      });
      setSelectedAssignee("");
      setShowTaskForm(false);
      setNotice("Task created successfully.");
    } catch (err) {
      console.error("Create task error:", err);
      setError(err.message || "Failed to create task.");
    } finally {
      setSavingTask(false);
    }
  };

  const clearFilters = () => {
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterAssignee("All");
  };

  return (
                <div
                  key={task._id}
                  className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center"
                >
                  {/* TASK */}

                  <div>
                    <p className="font-medium text-slate-800">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {task.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
                        {task.priority}
                      </span>

                      <button
                        onClick={() =>
                          setNotice(
                            "Comment composer opened for this task."
                          )
                        }
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        <MessageSquare size={12} />
                        Comment
                      </button>

                      <button
                        onClick={() =>
                          setNotice(
                            "Attachment feature will be connected later."
                          )
                        }
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        <Paperclip size={12} />
                        Attach
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Project:{" "}
                      <span className="font-medium text-slate-500">
                        {task.projectName ||
                          task.project?.name ||
                          "-"}
                      </span>
                    </p>
                  </div>

                  {/* ASSIGNEE */}

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold">
                      {employeeName
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </span>

                    {employeeName}
                  </div>

                  {/* STATUS */}

                  <span>
                    <select
                      value={task.status}
                      disabled={
                        updatingTaskId === task._id
                      }
                      onChange={(event) =>
                        updateEmployeeTaskStatus(
                          task._id,
                          event.target.value
                        )
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                        style[task.status] ||
                        style["To Do"]
                      }`}
                    >
                      {statuses.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>

                    {updatingTaskId === task._id && (
                      <span className="ml-2 text-[10px] text-slate-400">
                        Updating...
                      </span>
                    )}
                  </span>

                  {/* DUE DATE */}

                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <CalendarClock size={15} />

                    {task.dueDate
                      ? new Date(
                          task.dueDate
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </span>
                </div>
              );
            })}

          {/* ==================================================
              MANAGER TASKS
          ================================================== */}

          {role === "manager" &&
            filteredWorkItems.map((task) => {
              const employeeName =
                task.assignedToName ||
                task.assignedTo?.name ||
                "Unassigned";

              const createTask = async (event) => {
    event.preventDefault();

    if (
      !taskForm.title.trim() ||
      !taskForm.description.trim() ||
      !taskForm.projectId ||
      !taskForm.startDate ||
      !taskForm.dueDate
    ) {
      setError("Please fill all required task fields.");
      return;
    }

    if (new Date(taskForm.dueDate) < new Date(taskForm.startDate)) {
      setError("Due date cannot be before start date.");
      return;
    }

    try {
      setSavingTask(true);
      setError("");
      setNotice("");

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task.");
      }

      let createdTask = data.task;

      if (selectedAssignee) {
        const assignResponse = await fetch(
          `http://localhost:5000/api/tasks/${createdTask._id}/assign`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ employeeId: selectedAssignee }),
          }
        );

        const assignData = await assignResponse.json();

        if (!assignResponse.ok) {
          throw new Error(assignData.message || "Task assignment failed.");
        }

        createdTask = assignData.task;
      }

      setWorkItems((items) => [createdTask, ...items]);
      setTaskForm({
        title: "",
        description: "",
        projectId: "",
        priority: "Medium",
        status: "Not Started",
        startDate: "",
        dueDate: "",
      });
      setSelectedAssignee("");
      setShowTaskForm(false);
      setNotice("Task created successfully.");
    } catch (err) {
      console.error("Create task error:", err);
      setError(err.message || "Failed to create task.");
    } finally {
      setSavingTask(false);
    }
  };

  const clearFilters = () => {
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterAssignee("All");
  };

  return (
                <div
                  key={task._id}
                  className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center"
                >
                  {/* TASK */}

                  <div>
                    <p className="font-medium text-slate-800">
                      {task.title}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* ASSIGNEE */}

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold">
                      {employeeName
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </span>

                    {employeeName}
                  </div>

                  {/* STATUS */}

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      style[task.status] ||
                      style["To Do"]
                    }`}
                  >
                    {task.status}
                  </span>

                  {/* DUE DATE */}

                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <CalendarClock size={15} />
                    {task.dueDate
                      ? new Date(
                          task.dueDate
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </span>
                </div>
              );
            })}
        </div>
      )}
      {showTaskForm && role === "manager" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create new task</h2>
                <p className="mt-1 text-sm text-slate-500">Add a task to a project.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createTask} className="space-y-4 p-6">
              <input
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Task title"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <textarea
                required
                rows="3"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Task description"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  required
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>

                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <input
                  required
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />

                <input
                  required
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingTask ? "Creating..." : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
