import { useEffect, useMemo, useState } from "react";

import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  Info,
  Megaphone,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { useWorkspace } from "../Context/WorkspaceContext";

const API_URL = "https://taskflow-apms.onrender.com";

// ======================================================
// TYPES
// ======================================================

const announcementTypes = [
  "General Information",
  "Meeting",
  "Holiday",
  "Salary / Payroll",
  "Office Notice",
  "Policy Update",
  "Training",
  "Event",
  "Urgent Notice",
];

const priorities = ["Normal", "Important", "Urgent"];

// ======================================================
// HELPERS
// ======================================================

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeIcon(type) {
  switch (type) {
    case "Meeting":
      return CalendarDays;

    case "Holiday":
      return CalendarDays;

    case "Salary / Payroll":
      return DollarSign;

    case "Urgent Notice":
      return Bell;

    case "Training":
      return Users;

    default:
      return Megaphone;
  }
}

function getTypeStyle(type) {
  switch (type) {
    case "Meeting":
      return "bg-violet-50 text-violet-700";

    case "Holiday":
      return "bg-green-50 text-green-700";

    case "Salary / Payroll":
      return "bg-emerald-50 text-emerald-700";

    case "Urgent Notice":
      return "bg-red-50 text-red-700";

    case "Training":
      return "bg-blue-50 text-blue-700";

    case "Policy Update":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getPriorityStyle(priority) {
  switch (priority) {
    case "Urgent":
      return "bg-red-50 text-red-600";

    case "Important":
      return "bg-orange-50 text-orange-600";

    default:
      return "bg-slate-100 text-slate-500";
  }
}

// ======================================================
// INITIAL FORM
// ======================================================

const initialForm = {
  title: "",
  message: "",
  type: "General Information",
  priority: "Normal",
  audienceType: "all-employees",
  recipients: [],
  meetingDate: "",
  startTime: "",
  endTime: "",
  meetingMode: "Virtual",
  meetingLink: "",
  location: "",
  relatedProject: "",
};

// ======================================================
// COMPONENT
// ======================================================

export default function Announcements() {
  const { role, token, currentUser } = useWorkspace();

  const [announcements, setAnnouncements] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [search, setSearch] = useState("");

  const [filterType, setFilterType] = useState("All");

  const [form, setForm] = useState(initialForm);

  // ====================================================
  // FETCH ANNOUNCEMENTS
  // ====================================================

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load announcements.");
      }

      setAnnouncements(data);
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // FETCH EMPLOYEES
  // ====================================================

  const fetchEmployees = async () => {
    if (role !== "hr") return;

    try {
      const response = await fetch(
        "http://https://taskflow-apms.onrender.com/api/users/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setEmployees(data);
      }
    } catch (error) {
      console.error("Employees fetch error:", error);
    }
  };

  // ====================================================
  // FETCH PROJECTS
  // ====================================================

  const fetchProjects = async () => {
    try {
      const endpoint =
        role === "employee"
          ? "http://https://taskflow-apms.onrender.com/api/projects/my"
          : "http://https://taskflow-apms.onrender.com/api/projects";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      //taskflow-apms.onrender.com
      https: if (response.ok) {
        setProjects(data);
      }
    } catch (error) {
      console.error("Projects fetch error:", error);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchAnnouncements();
    fetchEmployees();
    fetchProjects();
  }, [token, role]);

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ====================================================
  // EMPLOYEE CHECKBOX
  // ====================================================

  const handleEmployeeSelection = (employeeId) => {
    setForm((previous) => {
      const exists = previous.recipients.includes(employeeId);

      return {
        ...previous,

        recipients: exists
          ? previous.recipients.filter((id) => id !== employeeId)
          : [...previous.recipients, employeeId],
      };
    });
  };

  // ====================================================
  // SELECT ALL EMPLOYEES
  // ====================================================

  const handleSelectAllEmployees = () => {
    setForm((previous) => ({
      ...previous,

      recipients:
        previous.recipients.length === employees.length
          ? []
          : employees.map((employee) => employee._id),
    }));
  };

  // ====================================================
  // OPEN CREATE
  // ====================================================

  const handleOpenCreate = () => {
    setEditingId(null);

    setForm({
      ...initialForm,

      audienceType: role === "manager" ? "hr" : "all-employees",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ====================================================
  // OPEN EDIT
  // ====================================================

  const handleOpenEdit = (announcement) => {
    const meeting = announcement.meeting || {};

    setEditingId(announcement._id);

    setForm({
      title: announcement.title || "",

      message: announcement.message || "",

      type: announcement.type || "General Information",

      priority: announcement.priority || "Normal",

      audienceType: announcement.audienceType || "all-employees",

      recipients:
        announcement.recipients?.map((user) => user._id || user) || [],

      meetingDate: meeting.date ? meeting.date.substring(0, 10) : "",

      startTime: meeting.startTime || "",

      endTime: meeting.endTime || "",

      meetingMode: meeting.mode || "Virtual",

      meetingLink: meeting.meetingLink || "",

      location: meeting.location || "",

      relatedProject:
        announcement.relatedProject?._id || announcement.relatedProject || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ====================================================
  // CLOSE FORM
  // ====================================================

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  };

  // ====================================================
  // SAVE ANNOUNCEMENT
  // ====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Validate selected employees
      if (
        role === "hr" &&
        form.audienceType === "selected-employees" &&
        form.recipients.length === 0
      ) {
        throw new Error("Please select at least one employee.");
      }

      // Validate meeting
      if (form.type === "Meeting") {
        if (!form.meetingDate) {
          throw new Error("Please select the meeting date.");
        }

        if (!form.startTime) {
          throw new Error("Please select the start time.");
        }

        if (!form.endTime) {
          throw new Error("Please select the end time.");
        }

        if (form.meetingMode === "Virtual" && !form.meetingLink) {
          throw new Error("Please enter the meeting link.");
        }

        if (form.meetingMode === "Office" && !form.location) {
          throw new Error("Please enter the office location.");
        }
      }

      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
        audienceType: form.audienceType,

        recipients:
          form.audienceType === "selected-employees" ? form.recipients : [],

        meeting:
          form.type === "Meeting"
            ? {
                date: form.meetingDate,
                startTime: form.startTime,
                endTime: form.endTime,
                mode: form.meetingMode,
                meetingLink: form.meetingLink,
                location: form.location,
              }
            : {
                date: null,
                startTime: "",
                endTime: "",
                mode: "",
                meetingLink: "",
                location: "",
              },

        relatedProject: form.relatedProject || null,
      };

      const url = editingId ? `${API_URL}/${editingId}` : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save announcement.");
      }

      if (editingId) {
        setAnnouncements((previous) =>
          previous.map((item) =>
            item._id === editingId ? data.announcement : item,
          ),
        );

        setSuccess("Announcement updated successfully.");
      } else {
        setAnnouncements((previous) => [data.announcement, ...previous]);

        setSuccess("Announcement published successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (announcementId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(announcementId);

      setError("");

      const response = await fetch(`${API_URL}/${announcementId}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete announcement.");
      }

      setAnnouncements((previous) =>
        previous.filter((item) => item._id !== announcementId),
      );

      if (selectedAnnouncement?._id === announcementId) {
        setSelectedAnnouncement(null);
      }

      setSuccess("Announcement deleted successfully.");
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  // ====================================================
  // MARK READ
  // ====================================================

  const handleOpenAnnouncement = async (announcement) => {
    try {
      const response = await fetch(`${API_URL}/${announcement._id}/read`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark announcement as read.");
      }

      const updatedAnnouncement = data.announcement || {
        ...announcement,
        readBy: [
          ...(announcement.readBy || []),
          currentUser?._id || currentUser?.id,
        ],
      };

      setAnnouncements((previous) =>
        previous.map((item) =>
          item._id === announcement._id ? updatedAnnouncement : item,
        ),
      );

      setSelectedAnnouncement(updatedAnnouncement);

      window.dispatchEvent(new Event("announcementUpdated"));
    } catch (error) {
      console.error("Mark read error:", error);

      setSelectedAnnouncement(announcement);
    }
  };

  // ====================================================
  // FILTER
  // ====================================================

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch =
        announcement.title?.toLowerCase().includes(search.toLowerCase()) ||
        announcement.message?.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        filterType === "All" || announcement.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [announcements, search, filterType]);

  // ====================================================
  // UNREAD
  // ====================================================

  const currentUserId = currentUser?._id || currentUser?.id || "";

  const unreadCount = announcements.filter((announcement) => {
    if (!currentUserId) {
      return false;
    }

    return !announcement.readBy?.some((user) => {
      const readUserId =
        typeof user === "object" ? user?._id || user?.id : user;

      return String(readUserId) === String(currentUserId);
    });
  }).length;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="space-y-6">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <Megaphone size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Announcements
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Company updates, important information and team communication.
              </p>
            </div>
          </div>
        </div>

        {(role === "manager" || role === "hr") && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <Plus size={17} />
            New Announcement
          </button>
        )}
      </div>

      {/* ==================================================
          MESSAGES
      ================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check size={17} />

          {success}
        </div>
      )}

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>

            <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600">
              <Megaphone size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {announcements.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">Available announcements</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Unread</span>

            <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
              <Bell size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {unreadCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">Information to review</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Meetings</span>

            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {announcements.filter((item) => item.type === "Meeting").length}
          </p>

          <p className="mt-1 text-xs text-slate-400">Meeting announcements</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Important</span>

            <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-50 text-orange-600">
              <Info size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {announcements.filter((item) => item.priority !== "Normal").length}
          </p>

          <p className="mt-1 text-xs text-slate-400">Important information</p>
        </div>
      </div>

      {/* ==================================================
          SEARCH + FILTER
      ================================================== */}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <Megaphone
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
        >
          <option value="All">All Types</option>

          {announcementTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* ==================================================
          CREATE / EDIT FORM
      ================================================== */}

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Announcement" : "Create Announcement"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Share important information with your team.
              </p>
            </div>

            <button
              onClick={handleCloseForm}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            {/* TITLE */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: Tomorrow is a company holiday"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* TYPE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Announcement Type
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
              >
                {announcementTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* PRIORITY */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Priority
              </label>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {/* MESSAGE */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Message
              </label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write the announcement..."
                rows="5"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* AUDIENCE */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Send To
              </label>

              {role === "manager" ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-100 text-violet-700">
                      <Users size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        HR Department
                      </p>

                      <p className="text-xs text-slate-500">
                        This announcement will be sent to HR.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="cursor-pointer rounded-xl border border-slate-200 p-4 hover:border-violet-300">
                    <input
                      type="radio"
                      name="audienceType"
                      value="all-employees"
                      checked={form.audienceType === "all-employees"}
                      onChange={handleChange}
                      className="mr-2"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      All Employees
                    </span>
                  </label>

                  <label className="cursor-pointer rounded-xl border border-slate-200 p-4 hover:border-violet-300">
                    <input
                      type="radio"
                      name="audienceType"
                      value="selected-employees"
                      checked={form.audienceType === "selected-employees"}
                      onChange={handleChange}
                      className="mr-2"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      Selected Employees
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* EMPLOYEE LIST */}

            {role === "hr" && form.audienceType === "selected-employees" && (
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Select Employees
                  </p>

                  <button
                    type="button"
                    onClick={handleSelectAllEmployees}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                  >
                    {form.recipients.length === employees.length
                      ? "Clear All"
                      : "Select All"}
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {employees.map((employee) => (
                    <label
                      key={employee._id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-violet-300"
                    >
                      <input
                        type="checkbox"
                        checked={form.recipients.includes(employee._id)}
                        onChange={() => handleEmployeeSelection(employee._id)}
                        className="h-4 w-4"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {employee.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {employee.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* MEETING */}

            {form.type === "Meeting" && (
              <div className="md:col-span-2 rounded-2xl border border-violet-100 bg-violet-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-100 text-violet-700">
                    <CalendarDays size={19} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      Meeting Details
                    </h3>

                    <p className="text-xs text-slate-500">
                      Add the meeting information for attendees.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Date
                    </label>

                    <input
                      type="date"
                      name="meetingDate"
                      value={form.meetingDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Start Time
                    </label>

                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      End Time
                    </label>

                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Meeting Mode
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3">
                      <input
                        type="radio"
                        name="meetingMode"
                        value="Virtual"
                        checked={form.meetingMode === "Virtual"}
                        onChange={handleChange}
                        className="mr-2"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        🟣 Virtual Meeting
                      </span>
                    </label>

                    <label className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3">
                      <input
                        type="radio"
                        name="meetingMode"
                        value="Office"
                        checked={form.meetingMode === "Office"}
                        onChange={handleChange}
                        className="mr-2"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        🟢 Office Meeting
                      </span>
                    </label>
                  </div>
                </div>

                {form.meetingMode === "Virtual" && (
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Meeting Link
                    </label>

                    <input
                      type="url"
                      name="meetingLink"
                      value={form.meetingLink}
                      onChange={handleChange}
                      placeholder="https://meet.google.com/..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                {form.meetingMode === "Office" && (
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Office Location
                    </label>

                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="Conference Room 2"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* PROJECT */}

            {projects.length > 0 && (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Related Project
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <select
                  name="relatedProject"
                  value={form.relatedProject}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                >
                  <option value="">No project</option>

                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* FORM ERROR */}

            {error && (
              <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Publish Announcement"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ==================================================
          ANNOUNCEMENT LIST
      ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Company Updates</h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest information from your organization.
            </p>
          </div>

          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            {filteredAnnouncements.length} updates
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading announcements...
            </p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <Megaphone size={34} className="mx-auto text-slate-300" />

            <h3 className="mt-3 font-semibold text-slate-700">
              No announcements
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              There are no announcements matching your search.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.map((announcement) => {
              const Icon = getTypeIcon(announcement.type);

              const currentUserId = currentUser?._id || currentUser?.id || "";

              const isRead =
                Boolean(currentUserId) &&
                announcement.readBy?.some((user) => {
                  const readUserId =
                    typeof user === "object" ? user?._id || user?.id : user;

                  return String(readUserId) === String(currentUserId);
                });

              const isUnread = !isRead;

              const isCreator =
                String(
                  announcement.createdBy?._id ||
                    announcement.createdBy?.id ||
                    announcement.createdBy ||
                    "",
                ) === String(currentUserId);

              return (
                <div
                  key={announcement._id}
                  className={`group rounded-2xl border p-5 transition hover:border-violet-200 hover:shadow-sm ${
                    isUnread
                      ? "border-violet-200 bg-violet-50/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${getTypeStyle(
                        announcement.type,
                      )}`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-800">
                              {announcement.title}
                            </h3>

                            {isUnread && (
                              <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                NEW
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getTypeStyle(
                                announcement.type,
                              )}`}
                            >
                              {announcement.type}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPriorityStyle(
                                announcement.priority,
                              )}`}
                            >
                              {announcement.priority}
                            </span>
                          </div>
                        </div>

                        <span className="shrink-0 text-xs text-slate-400">
                          {formatDateTime(announcement.createdAt)}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {announcement.message}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          By <strong>{announcement.createdByName}</strong>
                        </span>

                        {announcement.audienceType === "all-employees" && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            All Employees
                          </span>
                        )}

                        {announcement.audienceType === "selected-employees" && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {announcement.recipients?.length} Employees
                          </span>
                        )}

                        {announcement.audienceType === "hr" && (
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                            HR
                          </span>
                        )}

                        {announcement.type === "Meeting" &&
                          announcement.meeting && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                              <Clock size={12} />

                              {announcement.meeting.startTime}
                            </span>
                          )}

                        {!isUnread && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 font-semibold text-green-700">
                            <Check size={12} />
                            Read
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleOpenAnnouncement(announcement)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700"
                        >
                          View Details
                          <ChevronRight size={14} />
                        </button>

                        {role !== "employee" && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(announcement)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(announcement._id)}
                              disabled={deletingId === announcement._id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              <Trash2 size={14} />

                              {deletingId === announcement._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-lg ${getTypeStyle(
                      selectedAnnouncement.type,
                    )}`}
                  >
                    {(() => {
                      const Icon = getTypeIcon(selectedAnnouncement.type);

                      return <Icon size={19} />;
                    })()}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedAnnouncement.title}
                    </h2>

                    <p className="text-xs text-slate-400">
                      Published {formatDateTime(selectedAnnouncement.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getTypeStyle(
                    selectedAnnouncement.type,
                  )}`}
                >
                  {selectedAnnouncement.type}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getPriorityStyle(
                    selectedAnnouncement.priority,
                  )}`}
                >
                  {selectedAnnouncement.priority}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedAnnouncement.message}
                </p>
              </div>

              {/* MEETING DETAILS */}

              {selectedAnnouncement.type === "Meeting" &&
                selectedAnnouncement.meeting && (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                    <h3 className="font-bold text-slate-800">
                      Meeting Details
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs text-slate-400">Date</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(selectedAnnouncement.meeting.date)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs text-slate-400">Time</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {selectedAnnouncement.meeting.startTime} -{" "}
                          {selectedAnnouncement.meeting.endTime}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs text-slate-400">Mode</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {selectedAnnouncement.meeting.mode}
                        </p>
                      </div>

                      {selectedAnnouncement.meeting.mode === "Office" && (
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs text-slate-400">Location</p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {selectedAnnouncement.meeting.location}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedAnnouncement.meeting.mode === "Virtual" &&
                      selectedAnnouncement.meeting.meetingLink && (
                        <a
                          href={selectedAnnouncement.meeting.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                        >
                          Join Meeting
                          <ChevronRight size={16} />
                        </a>
                      )}
                  </div>
                )}

              {/* PROJECT */}

              {selectedAnnouncement.relatedProject?.name && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">Related Project</p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {selectedAnnouncement.relatedProject.name}
                  </p>
                </div>
              )}

              {/* PUBLISHED BY */}

              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {selectedAnnouncement.createdByName?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedAnnouncement.createdByName}
                  </p>

                  <p className="text-xs text-slate-400">
                    {selectedAnnouncement.createdByRole === "hr"
                      ? "HR"
                      : "Manager"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
