import {
  Plus,
  MoreHorizontal,
  Users,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { useWorkspace } from "../Context/WorkspaceContext";

export default function Projects() {
  const { role, token } = useWorkspace();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  // ======================================================
  // FILTER
  // ======================================================

  const [activeFilter, setActiveFilter] = useState("all");

  // ======================================================
  // FORM DATA
  // ======================================================

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Planning",
    priority: "Medium",
    startDate: "",
    dueDate: "",
  });

  // ======================================================
  // FETCH PROJECTS
  // ======================================================

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "http://localhost:5000/api/projects";

      // Employee gets only assigned projects
      if (role === "employee") {
        url = "http://localhost:5000/api/projects/my";
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load projects."
        );
      }

      setProjects(data);
    } catch (error) {
      console.error(error);

      setError(
        error.message || "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LOAD PROJECTS
  // ======================================================

  useEffect(() => {
    if (token && role) {
      fetchProjects();
    }
  }, [token, role]);

  // ======================================================
  // FORM INPUT
  // ======================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ======================================================
  // CREATE PROJECT
  // ======================================================

  const handleCreateProject = async (event) => {
    event.preventDefault();

    try {
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/projects",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create project."
        );
      }

      // Add newly created project to the list
      setProjects((previous) => [
        data.project,
        ...previous,
      ]);

      // Reset form
      setFormData({
        name: "",
        description: "",
        status: "Planning",
        priority: "Medium",
        startDate: "",
        dueDate: "",
      });

      setShowForm(false);

      // Show all projects after creating
      setActiveFilter("all");
    } catch (error) {
      console.error(error);

      setError(
        error.message || "Failed to create project."
      );
    }
  };

  // ======================================================
  // FILTER PROJECTS
  // ======================================================

  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "all") {
      return true;
    }

    if (activeFilter === "inProgress") {
      return project.status === "In Progress";
    }

    if (activeFilter === "completed") {
      return project.status === "Completed";
    }

    return true;
  });

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ======================================================
  // FILTER BUTTON
  // ======================================================

  const filterButtonClass = (filter) => {
    return `px-4 py-3 text-sm font-semibold border-b-2 transition ${
      activeFilter === filter
        ? "border-violet-600 text-violet-600"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`;
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Projects
        </h1>

        <p className="mt-4 text-sm text-slate-500">
          Loading projects...
        </p>
      </div>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div>
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Plan, track, and deliver your team’s best work.
          </p>
        </div>

        {/* Manager can create projects */}

        {role === "manager" && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus size={18} />

            New project
          </button>
        )}
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ==================================================
          FILTER TABS
      ================================================== */}

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={filterButtonClass("all")}
        >
          All projects
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("inProgress")}
          className={filterButtonClass("inProgress")}
        >
          In progress
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("completed")}
          className={filterButtonClass("completed")}
        >
          Completed
        </button>
      </div>

      {/* ==================================================
          CREATE PROJECT FORM
      ================================================== */}

      {showForm && role === "manager" && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Create New Project
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a new project to your workspace.
              </p>
            </div>

            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleCreateProject}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* PROJECT NAME */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Project Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter project name"
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
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>
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
                placeholder="Enter project description"
                rows="3"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              >
                <option value="Planning">
                  Planning
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="On Hold">
                  On Hold
                </option>
              </select>
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
                onClick={() =>
                  setShowForm(false)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================
          PROJECT CARDS
      ================================================== */}

      {filteredProjects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-800">
            No projects found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {activeFilter === "all"
              ? role === "manager"
                ? "Create your first project to get started."
                : "You have no projects assigned yet."
              : activeFilter === "inProgress"
              ? "There are no projects in progress."
              : "There are no completed projects."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            // Temporary progress calculation.
            // Task-based progress can be connected later.
            const progress =
              project.status === "Completed"
                ? 100
                : project.status === "In Progress"
                ? 50
                : 0;

            return (
              <Link
                key={project._id}
                to={`/${role}/projects/${project._id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* TOP */}

                <div className="flex items-center justify-between">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      project.priority === "High"
                        ? "bg-red-500"
                        : project.priority === "Medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />

                  <MoreHorizontal
                    size={20}
                    className="text-slate-400"
                  />
                </div>

                {/* NAME */}

                <h2 className="mt-5 font-bold text-slate-900">
                  {project.name}
                </h2>

                {/* DESCRIPTION */}

                <p className="mt-2 h-10 overflow-hidden text-sm leading-5 text-slate-500">
                  {project.description}
                </p>

                {/* STATUS */}

                <div className="mt-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      project.status ===
                      "Completed"
                        ? "bg-green-50 text-green-700"
                        : project.status ===
                          "In Progress"
                        ? "bg-blue-50 text-blue-700"
                        : project.status ===
                          "On Hold"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* PROGRESS */}

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>
                      Progress
                    </span>

                    <b className="text-slate-700">
                      {progress}%
                    </b>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        progress === 100
                          ? "bg-green-500"
                          : progress > 0
                          ? "bg-blue-500"
                          : "bg-slate-300"
                      }`}
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                {/* MEMBERS + DUE DATE */}

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex -space-x-2">
                    {project.members
                      ?.slice(0, 3)
                      .map((member) => (
                        <span
                          key={member._id}
                          title={member.name}
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600"
                        >
                          {member.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </span>
                      ))}

                    {project.members?.length >
                      3 && (
                      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-violet-100 text-[10px] text-violet-700">
                        <Users size={12} />
                      </span>
                    )}

                    {(!project.members ||
                      project.members.length ===
                        0) && (
                      <span className="text-xs text-slate-400">
                        No members
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400">
                    Due{" "}
                    {formatDate(
                      project.dueDate
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}