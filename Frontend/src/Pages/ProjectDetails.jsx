import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutDashboard,
  List,
  MessageSquare,
  Paperclip,
  Plus,
  UsersRound,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

import { useWorkspace } from "../Context/WorkspaceContext";

const tabs = [
  ["overview", "Overview", LayoutDashboard],
  ["board", "Board", CheckSquare],
  ["list", "List", List],
  ["timeline", "Timeline", CalendarDays],
  ["members", "Members", UsersRound],
  ["files", "Files", FileText],
  ["activity", "Activity", MessageSquare],
];

const priorityTone = {
  High: "bg-orange-50 text-orange-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
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

export default function ProjectDetails() {
  const { role, token } = useWorkspace();

  const { projectId } = useParams();

  const navigate = useNavigate();

  const [project, setProject] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [tab, setTab] = useState("overview");

  const [showEditForm, setShowEditForm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // ======================================================
  // EMPLOYEE ASSIGNMENT STATE
  // ======================================================

  const [employees, setEmployees] = useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);

  const [assigning, setAssigning] = useState(false);

  const [memberMessage, setMemberMessage] = useState("");

  const [memberError, setMemberError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "Medium",
    startDate: "",
    dueDate: "",
  });

  // ======================================================
  // TASK STATE
  // ======================================================

  const [tasks, setTasks] = useState([]);

  const [tasksLoading, setTasksLoading] = useState(false);

  const [taskError, setTaskError] = useState("");

  const [showTaskForm, setShowTaskForm] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState(null);

  const [taskSaving, setTaskSaving] = useState(false);

  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    status: "Not Started",
    priority: "Medium",
    startDate: "",
    dueDate: "",
  });

  const [assigningTaskId, setAssigningTaskId] = useState(null);

  const [taskAssignmentError, setTaskAssignmentError] = useState("");

  const [selectedTaskEmployeeId, setSelectedTaskEmployeeId] = useState("");

  // ======================================================
  // PROJECT ACTIVITY STATE
  // ======================================================

  const [activities, setActivities] = useState([]);

  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [activityError, setActivityError] = useState("");

  // ======================================================
  // FETCH PROJECT
  // ======================================================

  const fetchProject = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load project.");
      }

      setProject(data);

      setFormData({
        name: data.name || "",
        description: data.description || "",
        priority: data.priority || "Medium",
        startDate: data.startDate ? data.startDate.substring(0, 10) : "",
        dueDate: data.dueDate ? data.dueDate.substring(0, 10) : "",
      });
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId) {
      fetchProject();
    }
  }, [token, projectId]);

  // ======================================================
  // FETCH EMPLOYEES
  // ======================================================

  const fetchEmployees = async () => {
    try {
      setMemberError("");

      const response = await fetch(
        "http://https://taskflow-apms.onrender.com/api/users/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load employees.");
      }

      setEmployees(data);
    } catch (error) {
      console.error(error);

      setMemberError(error.message || "Failed to load employees.");
    }
  };

  // ======================================================
  // OPEN ADD MEMBER
  // ======================================================

  const handleOpenAddMember = async () => {
    setMemberMessage("");
    setMemberError("");
    setSelectedEmployeeId("");

    // The Add Member panel is rendered inside the Members tab.
    // Switch to Members when Add Member is clicked from Overview.
    setTab("members");
    setShowAddMember(true);

    await fetchEmployees();
  };

  // ======================================================
  // ASSIGN EMPLOYEE
  // ======================================================

  const handleAssignEmployee = async (event) => {
    event.preventDefault();

    if (!selectedEmployeeId) {
      setMemberError("Please select an employee.");

      return;
    }

    // Frontend duplicate check
    const alreadyAssigned = project?.members?.some(
      (member) => member._id === selectedEmployeeId,
    );

    if (alreadyAssigned) {
      setMemberError("This employee is already assigned to this project.");

      return;
    }

    try {
      setAssigning(true);

      setMemberError("");

      setMemberMessage("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/projects/${projectId}/members`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            employeeId: selectedEmployeeId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign employee.");
      }

      // Update project immediately
      setProject(data.project);

      setSelectedEmployeeId("");

      setMemberMessage("Employee assigned successfully.");

      // Keep the assignment panel open
      // so manager can assign another employee.
    } catch (error) {
      console.error(error);

      setMemberError(error.message || "Failed to assign employee.");
    } finally {
      setAssigning(false);
    }
  };

  // ======================================================
  // FETCH PROJECT TASKS
  // ======================================================

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      setTaskError("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/tasks/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load project tasks.");
      }

      setTasks(data);
    } catch (error) {
      console.error(error);

      setTaskError(error.message || "Failed to load project tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (
      token &&
      projectId &&
      (tab === "board" ||
        tab === "list" ||
        tab === "overview" ||
        tab === "timeline")
    ) {
      fetchTasks();
    }
  }, [token, projectId, tab]);

  // ======================================================
  // FETCH PROJECT ACTIVITIES
  // ======================================================

  const fetchProjectActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivityError("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/activities/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load project activity.");
      }

      setActivities(data);
    } catch (error) {
      console.error(error);

      setActivityError(error.message || "Failed to load project activity.");
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId && tab === "activity") {
      fetchProjectActivities();
    }
  }, [token, projectId, tab]);

  // ======================================================
  // TASK FORM CHANGE
  // ======================================================

  const handleTaskChange = (event) => {
    const { name, value } = event.target;

    setTaskFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ======================================================
  // OPEN CREATE TASK FORM
  // ======================================================

  const handleOpenCreateTask = () => {
    setTaskError("");

    setTaskFormData({
      title: "",
      description: "",
      status: "Not Started",
      priority: "Medium",
      startDate: project?.startDate ? project.startDate.substring(0, 10) : "",
      dueDate: project?.dueDate ? project.dueDate.substring(0, 10) : "",
    });

    setEditingTaskId(null);
    setSelectedTaskEmployeeId("");
    setShowTaskForm(true);
    setTab("board");
  };

  // ======================================================
  // OPEN EDIT TASK FORM
  // ======================================================

  const handleOpenEditTask = (task) => {
    setTaskError("");

    setTaskFormData({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "To Do",
      priority: task.priority || "Medium",
      startDate: task.startDate ? task.startDate.substring(0, 10) : "",
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
    });

    setEditingTaskId(task._id);
    setSelectedTaskEmployeeId("");
    setShowTaskForm(true);
    setTab("board");
  };

  // ======================================================
  // CREATE / UPDATE TASK
  // ======================================================

  const handleSaveTask = async (event) => {
    event.preventDefault();

    try {
      setTaskSaving(true);
      setTaskError("");

      const url = editingTaskId
        ? `http://https://taskflow-apms.onrender.com/api/tasks/${editingTaskId}`
        : "http://https://taskflow-apms.onrender.com/api/tasks";

      const method = editingTaskId ? "PUT" : "POST";

      const body = editingTaskId
        ? taskFormData
        : { ...taskFormData, projectId };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save task.");
      }

      let savedTask = data.task;

      // When creating a task, optionally assign it immediately.
      if (!editingTaskId && selectedTaskEmployeeId) {
        const assignResponse = await fetch(
          `http://https://taskflow-apms.onrender.com/api/tasks/${savedTask._id}/assign`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              employeeId: selectedTaskEmployeeId,
            }),
          },
        );

        const assignData = await assignResponse.json();

        if (!assignResponse.ok) {
          throw new Error(
            assignData.message || "Task was created, but assignment failed.",
          );
        }

        savedTask = assignData.task;
      }

      if (editingTaskId) {
        setTasks((previous) =>
          previous.map((task) =>
            task._id === editingTaskId ? savedTask : task,
          ),
        );
      } else {
        setTasks((previous) => [savedTask, ...previous]);
      }

      setTaskFormData({
        title: "",
        description: "",
        status: "Not Started",
        priority: "Medium",
        startDate: "",
        dueDate: "",
      });

      setSelectedTaskEmployeeId("");
      setEditingTaskId(null);
      setShowTaskForm(false);

      // Re-fetch so progress/status and populated assignment data stay current.
      await fetchTasks();
      await fetchProject();
    } catch (error) {
      console.error(error);
      setTaskError(error.message || "Failed to save task.");
    } finally {
      setTaskSaving(false);
    }
  };

  // ======================================================
  // DELETE TASK
  // ======================================================

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);
      setTaskError("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/tasks/${taskId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task.");
      }

      setTasks((previous) => previous.filter((task) => task._id !== taskId));
    } catch (error) {
      console.error(error);

      setTaskError(error.message || "Failed to delete task.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  // ======================================================
  // ASSIGN TASK TO PROJECT EMPLOYEE
  // ======================================================

  const handleAssignTask = async (taskId, employeeId) => {
    try {
      setAssigningTaskId(taskId);
      setTaskAssignmentError("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/tasks/${taskId}/assign`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            employeeId: employeeId || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign task.");
      }

      setTasks((previous) =>
        previous.map((task) => (task._id === taskId ? data.task : task)),
      );
    } catch (error) {
      console.error(error);

      setTaskAssignmentError(error.message || "Failed to assign task.");
    } finally {
      setAssigningTaskId(null);
    }
  };

  // ======================================================
  // CLOSE TASK FORM
  // ======================================================

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTaskId(null);
    setSelectedTaskEmployeeId("");
    setTaskError("");

    setTaskFormData({
      title: "",
      description: "",
      status: "Not Started",
      priority: "Medium",
      startDate: "",
      dueDate: "",
    });
  };

  // ======================================================
  // FORM CHANGE
  // ======================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ======================================================
  // UPDATE PROJECT
  // ======================================================

  const handleUpdateProject = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      setError("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/projects/${projectId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update project.");
      }

      setProject(data.project);
      setShowEditForm(false);

      // Refresh the project so status/progress and all displayed data are current.
      await fetchProject();
      await fetchTasks();
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // DELETE PROJECT
  // ======================================================

  const handleDeleteProject = async () => {
    try {
      setDeleting(true);

      setError("");

      const response = await fetch(
        `http://https://taskflow-apms.onrender.com/api/projects/${projectId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete project.");
      }

      setShowDeleteConfirm(false);
      navigate(`/${role}/projects`);
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to delete project.");

      setDeleting(false);
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Project</h1>

        <p className="mt-4 text-sm text-slate-500">Loading project...</p>
      </div>
    );
  }

  // ======================================================
  // ERROR / NOT FOUND
  // ======================================================

  if (error && !project) {
    return (
      <div>
        <Link
          to={`/${role}/projects`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-violet-600"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // ======================================================
  // PROJECT PROGRESS
  // ======================================================

  const progress =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((task) => task.status === "Completed").length /
            tasks.length) *
            100,
        )
      : project.status === "Completed"
        ? 100
        : project.status === "In Progress"
          ? 50
          : 0;

  return (
    <div className="space-y-6">
      {/* ==================================================
          BACK
      ================================================== */}

      <div>
        <Link
          to={`/${role}/projects`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-violet-600"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  project.priority === "High"
                    ? "bg-red-500"
                    : project.priority === "Medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
              />

              <h1 className="text-2xl font-bold text-slate-900">
                {project.name}
              </h1>

              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                {project.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">{project.description}</p>
          </div>

          {/* MANAGER ACTIONS */}

          {role === "manager" && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                <Trash2 size={16} />
                Delete
              </button>

              <button
                onClick={handleOpenCreateTask}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Plus size={17} />
                Add task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ==================================================
          EDIT FORM
      ================================================== */}

      {showEditForm && role === "manager" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit Project</h2>

              <p className="mt-1 text-sm text-slate-500">
                Update project information.
              </p>
            </div>

            <button
              onClick={() => setShowEditForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleUpdateProject}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* NAME */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Project Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* PRIORITY */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Priority
              </label>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              >
                <option value="Low">Low</option>

                <option value="Medium">Medium</option>

                <option value="High">High</option>
              </select>
            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* START DATE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Start Date
              </label>

              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* DUE DATE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Due Date
              </label>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* BUTTONS */}

            <div className="flex items-end justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ==================================================
          DELETE CONFIRMATION
      ================================================== */}

      {showDeleteConfirm && role === "manager" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-red-800">Delete this project?</h2>

              <p className="mt-1 text-sm text-red-600">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          TABS
      ================================================== */}

      <div className="overflow-x-auto border-b border-slate-200">
        <nav className="flex min-w-max gap-1">
          {tabs.map(([id, label, Icon]) => (
            <button
              onClick={() => setTab(id)}
              key={id}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${
                tab === id
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={16} />

              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ==================================================
          OVERVIEW
      ================================================== */}

      {tab === "overview" && (
        <div className="space-y-6">
          {/* PROJECT INFORMATION */}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">Status</p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {project.status}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">Priority</p>

              <p
                className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                  priorityTone[project.priority]
                }`}
              >
                {project.priority}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">Start Date</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatDate(project.startDate)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">Due Date</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatDate(project.dueDate)}
              </p>
            </div>
          </div>

          {/* PROGRESS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Project Progress</h2>

                <p className="text-sm text-slate-500">
                  {tasks.length > 0
                    ? `${
                        tasks.filter((task) => task.status === "Completed")
                          .length
                      } of ${tasks.length} tasks completed.`
                    : "Progress will be calculated from tasks."}
                </p>
              </div>

              <span className="text-lg font-bold text-slate-900">
                {progress}%
              </span>
            </div>

            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </section>

          {/* PROJECT TEAM */}

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <h2 className="font-bold text-slate-900">Project Information</h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {project.description}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Created By</p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {project.createdBy?.name || project.createdByName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Created On</p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(project.createdAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Project Team</h2>

                {role === "manager" && (
                  <button
                    onClick={handleOpenAddMember}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    <Plus size={14} />
                    Add Member
                  </button>
                )}
              </div>

              <div className="mt-5 space-y-4">
                {project.members && project.members.length > 0 ? (
                  project.members.map((member) => (
                    <div className="flex items-center gap-3" key={member._id}>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {member.name?.charAt(0).toUpperCase()}
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {member.name}
                        </p>

                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No members assigned yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ==================================================
          BOARD
      ================================================== */}

      {tab === "board" && (
        <div className="space-y-5">
          {showTaskForm && role === "manager" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingTaskId ? "Edit Task" : "Create New Task"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {editingTaskId
                      ? "Update task information."
                      : `Create a task for ${project.name}.`}
                  </p>
                </div>

                <button
                  onClick={handleCloseTaskForm}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSaveTask}
                className="grid gap-4 md:grid-cols-2"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Task Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={taskFormData.title}
                    onChange={handleTaskChange}
                    placeholder="Enter task title"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={taskFormData.priority}
                    onChange={handleTaskChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="Low">Low</option>

                    <option value="Medium">Medium</option>

                    <option value="High">High</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={taskFormData.description}
                    onChange={handleTaskChange}
                    placeholder="Enter task description"
                    rows="3"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                {!editingTaskId && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Assign Employee
                    </label>

                    <select
                      value={selectedTaskEmployeeId}
                      onChange={(event) =>
                        setSelectedTaskEmployeeId(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="">Unassigned</option>
                      {(project.members || []).map((member) => (
                        <option
                          key={member._id || member}
                          value={member._id || member}
                        >
                          {member.name || "Employee"}
                        </option>
                      ))}
                    </select>

                    {(project.members || []).length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        Add an employee to this project first.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={taskFormData.status}
                    onChange={handleTaskChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="To Do">To Do</option>

                    <option value="In Progress">In Progress</option>

                    <option value="Review">Review</option>

                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    value={taskFormData.startDate}
                    onChange={handleTaskChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Due Date
                  </label>

                  <input
                    type="date"
                    name="dueDate"
                    value={taskFormData.dueDate}
                    onChange={handleTaskChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                {taskError && (
                  <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {taskError}
                  </div>
                )}

                <div className="flex items-end justify-end gap-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={handleCloseTaskForm}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={taskSaving}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {taskSaving
                      ? "Saving..."
                      : editingTaskId
                        ? "Save Changes"
                        : "Create Task"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Task Board</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage tasks for this project.
                </p>
              </div>

              {role === "manager" && !showTaskForm && (
                <button
                  onClick={handleOpenCreateTask}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  <Plus size={17} />
                  Add Task
                </button>
              )}
            </div>

            {taskError && !showTaskForm && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {taskError}
              </div>
            )}

            {tasksLoading ? (
              <p className="mt-6 text-sm text-slate-500">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <CheckSquare size={30} className="mx-auto text-slate-400" />

                <p className="mt-3 text-sm text-slate-500">
                  No tasks created for this project yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                {["To Do", "In Progress", "Review", "Completed"].map(
                  (status) => {
                    const statusTasks = tasks.filter(
                      (task) => task.status === status,
                    );

                    return (
                      <div key={status} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-700">
                            {status}
                          </h3>

                          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                            {statusTasks.length}
                          </span>
                        </div>

                        <div className="mt-3 space-y-3">
                          {statusTasks.length === 0 ? (
                            <p className="py-5 text-center text-xs text-slate-400">
                              No tasks
                            </p>
                          ) : (
                            statusTasks.map((task) => (
                              <div
                                key={task._id}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-slate-800">
                                    {task.title}
                                  </h4>

                                  <span
                                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                      task.priority === "High"
                                        ? "bg-red-50 text-red-600"
                                        : task.priority === "Medium"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-green-50 text-green-700"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                </div>

                                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                                  {task.description}
                                </p>

                                {role === "manager" && (
                                  <div className="mt-3">
                                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                                      Assign Employee
                                    </label>

                                    <select
                                      value={
                                        task.assignedTo?._id ||
                                        task.assignedTo ||
                                        ""
                                      }
                                      onChange={(event) =>
                                        handleAssignTask(
                                          task._id,
                                          event.target.value,
                                        )
                                      }
                                      disabled={assigningTaskId === task._id}
                                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-violet-500 disabled:opacity-50"
                                    >
                                      <option value="">
                                        {assigningTaskId === task._id
                                          ? "Updating..."
                                          : "Unassigned"}
                                      </option>

                                      {(project.members || []).map((member) => (
                                        <option
                                          key={member._id || member}
                                          value={member._id || member}
                                        >
                                          {member.name || "Employee"}
                                        </option>
                                      ))}
                                    </select>

                                    {taskAssignmentError &&
                                      assigningTaskId === null && (
                                        <p className="mt-1 text-[10px] text-red-600">
                                          {taskAssignmentError}
                                        </p>
                                      )}
                                  </div>
                                )}

                                <div className="mt-4 border-t border-slate-100 pt-3">
                                  <p className="text-[11px] text-slate-400">
                                    Due {formatDate(task.dueDate)}
                                  </p>

                                  {task.assignedToName && (
                                    <p className="mt-1 text-[11px] text-slate-500">
                                      Assigned to: {task.assignedToName}
                                    </p>
                                  )}
                                </div>

                                {role === "manager" && (
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => handleOpenEditTask(task)}
                                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      onClick={() => handleDeleteTask(task._id)}
                                      disabled={deletingTaskId === task._id}
                                      className="flex-1 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                    >
                                      {deletingTaskId === task._id
                                        ? "Deleting..."
                                        : "Delete"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================================================
          LIST
      ================================================== */}

      {tab === "list" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Task List</h2>

              <p className="mt-1 text-sm text-slate-500">
                All tasks for this project.
              </p>
            </div>

            {role === "manager" && (
              <button
                onClick={handleOpenCreateTask}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Plus size={17} />
                Add Task
              </button>
            )}
          </div>

          {taskError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {taskError}
            </div>
          )}

          {tasksLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <List size={30} className="mx-auto text-slate-400" />

              <p className="mt-3 text-sm text-slate-500">
                No tasks created for this project yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-400">
                    <th className="px-3 py-3 font-semibold">Task</th>

                    <th className="px-3 py-3 font-semibold">Status</th>

                    <th className="px-3 py-3 font-semibold">Priority</th>

                    <th className="px-3 py-3 font-semibold">Start</th>

                    <th className="px-3 py-3 font-semibold">Due</th>

                    <th className="px-3 py-3 font-semibold">Assigned To</th>

                    {role === "manager" && (
                      <th className="px-3 py-3 text-right font-semibold">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task._id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold text-slate-800">
                          {task.title}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                          {task.description}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          {task.status}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            task.priority === "High"
                              ? "bg-red-50 text-red-600"
                              : task.priority === "Medium"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-xs text-slate-500">
                        {formatDate(task.startDate)}
                      </td>

                      <td className="px-3 py-4 text-xs text-slate-500">
                        {formatDate(task.dueDate)}
                      </td>

                      <td className="px-3 py-4 text-xs text-slate-500">
                        {task.assignedToName || "Not assigned"}
                      </td>

                      {role === "manager" && (
                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              disabled={deletingTaskId === task._id}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingTaskId === task._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ==================================================
          TIMELINE
      ================================================== */}

      {tab === "timeline" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Project Timeline</h2>
              <p className="mt-1 text-sm text-slate-500">
                Track project tasks from start date to due date.
              </p>
            </div>

            <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </div>
          </div>

          {tasksLoading ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <CalendarDays
                size={30}
                className="mx-auto animate-pulse text-violet-500"
              />
              <p className="mt-3 text-sm text-slate-500">Loading timeline...</p>
            </div>
          ) : taskError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {taskError}
            </div>
          ) : tasks.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <CalendarDays size={32} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-semibold text-slate-700">
                No tasks yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create tasks for this project to see them on the timeline.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {tasks
                .slice()
                .sort((a, b) => {
                  const aDate = a.startDate || a.dueDate || "";
                  const bDate = b.startDate || b.dueDate || "";
                  return new Date(aDate) - new Date(bDate);
                })
                .map((task) => {
                  const start = task.startDate
                    ? new Date(task.startDate)
                    : project.startDate
                      ? new Date(project.startDate)
                      : null;

                  const due = task.dueDate
                    ? new Date(task.dueDate)
                    : project.dueDate
                      ? new Date(project.dueDate)
                      : start;

                  const projectStart = project.startDate
                    ? new Date(project.startDate)
                    : start;

                  const projectDue = project.dueDate
                    ? new Date(project.dueDate)
                    : due;

                  let left = 0;
                  let width = 100;

                  if (start && due && projectStart && projectDue) {
                    const total = projectDue.getTime() - projectStart.getTime();

                    if (total > 0) {
                      const taskStart = Math.max(
                        0,
                        start.getTime() - projectStart.getTime(),
                      );

                      const taskEnd = Math.min(
                        total,
                        due.getTime() - projectStart.getTime(),
                      );

                      left = Math.max(
                        0,
                        Math.min(100, (taskStart / total) * 100),
                      );

                      width = Math.max(
                        3,
                        Math.min(
                          100 - left,
                          ((taskEnd - taskStart) / total) * 100,
                        ),
                      );
                    }
                  }

                  const statusClass =
                    task.status === "Completed"
                      ? "bg-green-500"
                      : task.status === "In Progress"
                        ? "bg-blue-500"
                        : task.status === "Review"
                          ? "bg-amber-500"
                          : "bg-slate-400";

                  return (
                    <div
                      key={task._id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="w-full lg:w-64 lg:shrink-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                {task.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                {task.description || "No description"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                task.priority === "High"
                                  ? "bg-red-50 text-red-600"
                                  : task.priority === "Medium"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-green-50 text-green-700"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex justify-between text-[11px] text-slate-400">
                            <span>{formatDate(start)}</span>
                            <span>{formatDate(due)}</span>
                          </div>

                          <div className="relative h-9 rounded-lg bg-slate-100">
                            <div
                              className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-md ${statusClass}`}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="w-full lg:w-28 lg:shrink-0 lg:text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              task.status === "Completed"
                                ? "bg-green-50 text-green-700"
                                : task.status === "In Progress"
                                  ? "bg-blue-50 text-blue-700"
                                  : task.status === "Review"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {tasks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                To Do
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Review
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Completed
              </span>
            </div>
          )}
        </section>
      )}

      {/* ==================================================
          MEMBERS
      ================================================== */}

      {tab === "members" && (
        <div className="space-y-5">
          {/* ADD MEMBER PANEL */}

          {role === "manager" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">Project Members</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Assign employees to this project.
                  </p>
                </div>

                <button
                  onClick={
                    showAddMember
                      ? () => {
                          setShowAddMember(false);
                          setMemberMessage("");
                          setMemberError("");
                        }
                      : handleOpenAddMember
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  {showAddMember ? <X size={17} /> : <Plus size={17} />}

                  {showAddMember ? "Close" : "Add Member"}
                </button>
              </div>

              {showAddMember && (
                <form
                  onSubmit={handleAssignEmployee}
                  className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4"
                >
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Select Employee
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectedEmployeeId}
                      onChange={(event) =>
                        setSelectedEmployeeId(event.target.value)
                      }
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="">-- Select Employee --</option>

                      {employees
                        .filter(
                          (employee) =>
                            !project.members?.some(
                              (member) => member._id === employee._id,
                            ),
                        )
                        .map((employee) => (
                          <option key={employee._id} value={employee._id}>
                            {employee.name} - {employee.email}
                          </option>
                        ))}
                    </select>

                    <button
                      type="submit"
                      disabled={assigning || !selectedEmployeeId}
                      className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assigning ? "Assigning..." : "Assign"}
                    </button>
                  </div>

                  {employees.filter(
                    (employee) =>
                      !project.members?.some(
                        (member) => member._id === employee._id,
                      ),
                  ).length === 0 && (
                    <p className="mt-3 text-sm text-slate-500">
                      All available employees are already assigned to this
                      project.
                    </p>
                  )}

                  {memberError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {memberError}
                    </div>
                  )}

                  {memberMessage && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
                      {memberMessage}
                    </div>
                  )}
                </form>
              )}
            </section>
          )}

          {/* CURRENT MEMBERS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {project.members && project.members.length > 0 ? (
              project.members.map((member) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                  key={member._id}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    {member.name?.charAt(0).toUpperCase()}
                  </span>

                  <p className="mt-4 font-bold text-slate-800">{member.name}</p>

                  <p className="text-sm text-slate-500">{member.role}</p>

                  <p className="mt-4 text-xs text-slate-400">{member.email}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <UsersRound size={30} className="mx-auto text-slate-400" />

                <p className="mt-3 text-sm text-slate-500">
                  No employees assigned to this project yet.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================================================
          FILES - TEMPORARY
      ================================================== */}

      {tab === "files" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Paperclip size={32} className="mx-auto text-violet-500" />

          <h2 className="mt-3 font-bold text-slate-800">Project Files</h2>

          <p className="mt-1 text-sm text-slate-500">
            File management will be added later.
          </p>
        </section>
      )}

      {/* ==================================================
          ACTIVITY
      ================================================== */}

      {tab === "activity" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Project Activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recent activities and changes made in this project.
              </p>
            </div>

            <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
              {activities.length}{" "}
              {activities.length === 1 ? "activity" : "activities"}
            </div>
          </div>

          {activitiesLoading ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <MessageSquare
                size={30}
                className="mx-auto animate-pulse text-violet-500"
              />
              <p className="mt-3 text-sm text-slate-500">
                Loading project activity...
              </p>
            </div>
          ) : activityError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {activityError}
            </div>
          ) : activities.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <MessageSquare size={32} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-semibold text-slate-700">
                No activity yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Project activity will appear here when changes are made.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity._id}
                  className="flex gap-4 rounded-xl border border-slate-200 p-4"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700">
                    <MessageSquare size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {activity.action || "Project Activity"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {activity.description ||
                            "A project activity was recorded."}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                        {activity.userName || activity.user?.name || "User"}
                      </span>

                      {activity.userRole || activity.user?.role ? (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
                          {activity.userRole || activity.user?.role}
                        </span>
                      ) : null}

                      {activity.relatedTask?.title ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                          Task: {activity.relatedTask.title}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
