const express = require("express");
const mongoose = require("mongoose");

const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const Activity = require("../models/Activity");
const {
  syncProjectProgress,
} = require("../utils/projectProgress");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();
const TASK_STATUSES = ["Not Started", "To Do", "In Progress", "Review", "Completed"];

router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid task ID." });
  return next();
});
router.param("projectId", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid project ID." });
  return next();
});

// ======================================================
// MANAGER → CREATE TASK
// ======================================================

router.post(
  "/",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        projectId,
        status,
        priority,
        employeeId,
        startDate,
        dueDate,
      } = req.body;

      if (
        typeof title !== "string" || !title.trim() ||
        typeof description !== "string" || !description.trim() ||
        !projectId ||
        !startDate ||
        !dueDate
      ) {
        return res.status(400).json({
          message:
            "Title, description, project, start date and due date are required.",
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      const start = new Date(startDate);
      const due = new Date(dueDate);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(due.getTime())
      ) {
        return res.status(400).json({
          message: "Invalid task dates.",
        });
      }

      if (due < start) {
        return res.status(400).json({
          message: "Due date cannot be before start date.",
        });
      }

      if (start < project.startDate || due > project.dueDate) {
        return res.status(400).json({
          message: "Task dates must fall within the project dates.",
        });
      }

      if (status && !TASK_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid task status." });
      }

      let assignee = null;
      if (employeeId) {
        if (!mongoose.isValidObjectId(employeeId)) {
          return res.status(400).json({ message: "Invalid employee ID." });
        }
        assignee = await User.findOne({ _id: employeeId, role: "employee", isActive: { $ne: false } });
        if (!assignee || !project.members.some((memberId) => String(memberId) === String(employeeId))) {
          return res.status(400).json({
            message: "Assignee must be an active employee assigned to this project.",
          });
        }
      }

      const manager = await User.findById(req.user.id);

      if (!manager) {
        return res.status(404).json({
          message: "Manager not found.",
        });
      }

      const task = await Task.create({
        title: title.trim(),
        description: description.trim(),
        project: project._id,
        projectName: project.name,
        status: status || "Not Started",
        priority: priority || "Medium",
        startDate: start,
        dueDate: due,
        createdBy: manager._id,
        createdByName: manager.name,
        assignedTo: assignee?._id || null,
        assignedToName: assignee?.name || null,
      });

      await syncProjectProgress(project._id);

      await Activity.create({
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: "Created Task",
        description: `${manager.name} created task "${task.title}" in project "${project.name}".`,
        type: "task",
        relatedProject: project._id,
        relatedTask: task._id,
      });

      const createdTask = await Task.findById(task._id)
        .populate("project", "name status priority")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      res.status(201).json({
        message: "Task created successfully.",
        task: createdTask,
      });
    } catch (error) {
      console.error("Create task error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER + HR → GET ALL TASKS
// Used by Analytics
// ======================================================

router.get(
  "/",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const tasks = await Task.find()
        .sort({ createdAt: -1 })
        .populate("project", "name status priority")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      res.json(tasks);
    } catch (error) {
      console.error("Get all tasks error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → GET TASKS BY PROJECT
// ======================================================

router.get(
  "/project/:projectId",
  protect,
  allowRoles("manager", "employee"),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      // Manager can view tasks for any project
      if (req.user.role === "manager") {
        const tasks = await Task.find({
          project: project._id,
        })
          .sort({ createdAt: -1 })
          .populate("project", "name status priority")
          .populate("createdBy", "name email role")
          .populate("assignedTo", "name email role");

        return res.json(tasks);
      }

      // Employee can view tasks only if they are a member of the project
      if (req.user.role === "employee") {
        const isProjectMember = project.members.some(
          (memberId) =>
            memberId.toString() === req.user.id.toString()
        );

        if (!isProjectMember) {
          return res.status(403).json({
            message: "Access denied. You are not a member of this project.",
          });
        }

        const tasks = await Task.find({
          project: project._id,
        })
          .sort({ createdAt: -1 })
          .populate("project", "name status priority")
          .populate("createdBy", "name email role")
          .populate("assignedTo", "name email role");

        return res.json(tasks);
      }

      return res.status(403).json({
        message: "Access denied.",
      });
    } catch (error) {
      console.error("Get project tasks error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// EMPLOYEE → VIEW MY TASKS
// ======================================================

router.get(
  "/my",
  protect,
  allowRoles("employee"),
  async (req, res) => {
    try {
      const tasks = await Task.find({
        assignedTo: req.user.id,
      })
        .sort({ dueDate: 1, createdAt: -1 })
        .populate("project", "name status priority")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      res.json(tasks);
    } catch (error) {
      console.error("Get my tasks error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// EMPLOYEE → UPDATE MY TASK STATUS
// ======================================================

router.put(
  "/:id/status",
  protect,
  allowRoles("employee"),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid task status.",
        });
      }

      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      // Employee can update only their own task
      if (
        !task.assignedTo ||
        task.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message:
            "You can only update tasks assigned to you.",
        });
      }

      const employee = await User.findById(req.user.id);

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found.",
        });
      }

      const oldStatus = task.status;

      task.status = status;

      await task.save();
      await syncProjectProgress(task.project);

      await Activity.create({
        user: employee._id,
        userName: employee.name,
        userRole: employee.role,
        action: "Updated Task Status",
        description: `${employee.name} changed task "${task.title}" from "${oldStatus}" to "${status}".`,
        type: "task",
        relatedProject: task.project,
        relatedTask: task._id,
      });

      const updatedTask = await Task.findById(task._id)
        .populate("project", "name status priority")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      res.json({
        message: "Task status updated successfully.",
        task: updatedTask,
      });
    } catch (error) {
      console.error(
        "Update my task status error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → GET ONE TASK
// ======================================================

router.get(
  "/:id",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate("project", "name status priority")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      res.json(task);
    } catch (error) {
      console.error("Get task error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → ASSIGN / UNASSIGN TASK
// ======================================================

router.put(
  "/:id/assign",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const { employeeId } = req.body;

      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      const project = await Project.findById(task.project);

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      const manager = await User.findById(req.user.id);

      if (!manager) {
        return res.status(404).json({
          message: "Manager not found.",
        });
      }

      // ==================================================
      // UNASSIGN TASK
      // ==================================================

      if (!employeeId) {
        const previousEmployee = task.assignedToName;

        task.assignedTo = null;
        task.assignedToName = null;

        await task.save();

        await Activity.create({
          user: manager._id,
          userName: manager.name,
          userRole: manager.role,
          action: "Unassigned Task",
          description: `${manager.name} unassigned task "${task.title}"${
            previousEmployee
              ? ` from ${previousEmployee}`
              : ""
          }.`,
          type: "task",
          relatedProject: project._id,
          relatedTask: task._id,
        });
      }

      // ==================================================
      // ASSIGN TASK
      // ==================================================

      else {
        const employee = await User.findById(employeeId);

        if (!employee) {
          return res.status(404).json({
            message: "Employee not found.",
          });
        }

        if (employee.role !== "employee" || employee.isActive === false) {
          return res.status(400).json({
            message:
              "Only employees can be assigned to a task.",
          });
        }

        // Employee must belong to project
        const isProjectMember = project.members.some(
          (memberId) =>
            memberId.toString() ===
            employee._id.toString()
        );

        if (!isProjectMember) {
          return res.status(400).json({
            message:
              "Employee must be assigned to the project before receiving its tasks.",
          });
        }

        const previousEmployee = task.assignedToName;

        task.assignedTo = employee._id;
        task.assignedToName = employee.name;

        await task.save();

        const action =
          previousEmployee &&
          previousEmployee !== employee.name
            ? "Reassigned Task"
            : "Assigned Task";

        const description =
          previousEmployee &&
          previousEmployee !== employee.name
            ? `${manager.name} reassigned task "${task.title}" from ${previousEmployee} to ${employee.name}.`
            : `${manager.name} assigned task "${task.title}" to ${employee.name}.`;

        await Activity.create({
          user: manager._id,
          userName: manager.name,
          userRole: manager.role,
          action,
          description,
          type: "task",
          relatedProject: project._id,
          relatedTask: task._id,
        });
      }

      const updatedTask = await Task.findById(task._id)
        .populate("project", "name status priority")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      res.json({
        message: employeeId
          ? "Task assigned successfully."
          : "Task unassigned successfully.",
        task: updatedTask,
      });
    } catch (error) {
      console.error("Assign task error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → UPDATE TASK
// ======================================================

router.put(
  "/:id",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      const {
        title,
        description,
        projectId,
        status,
        priority,
        startDate,
        dueDate,
      } = req.body;

      const originalProjectId = task.project.toString();
      let project = await Project.findById(task.project);

      if (projectId) {
        project = await Project.findById(projectId);

        if (!project) {
          return res.status(404).json({
            message: "Project not found.",
          });
        }

        task.project = project._id;
        task.projectName = project.name;

        // Clear assignment if task is moved
        // to another project.
        task.assignedTo = null;
        task.assignedToName = null;
      }

      const finalStartDate =
        startDate || task.startDate;

      const finalDueDate =
        dueDate || task.dueDate;

      const start = new Date(finalStartDate);
      const due = new Date(finalDueDate);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(due.getTime())
      ) {
        return res.status(400).json({
          message: "Invalid task dates.",
        });
      }

      if (due < start) {
        return res.status(400).json({
          message: "Due date cannot be before start date.",
        });
      }

      if (title !== undefined) {
        task.title = title.trim();
      }

      if (description !== undefined) {
        task.description = description.trim();
      }

      if (status !== undefined) {
        if (!TASK_STATUSES.includes(status)) {
          return res.status(400).json({
            message: "Invalid task status.",
          });
        }

        task.status = status;
      }

      if (priority !== undefined) {
        task.priority = priority;
      }

      task.startDate = start;
      task.dueDate = due;

      await task.save();
      await syncProjectProgress(project._id);

      if (originalProjectId !== project._id.toString()) {
        await syncProjectProgress(originalProjectId);
      }

      const manager = await User.findById(req.user.id);

      await Activity.create({
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: "Updated Task",
        description: `${manager.name} updated task "${task.title}".`,
        type: "task",
        relatedProject: project._id,
        relatedTask: task._id,
      });

      const updatedTask = await Task.findById(task._id)
        .populate("project", "name status priority")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      res.json({
        message: "Task updated successfully.",
        task: updatedTask,
      });
    } catch (error) {
      console.error("Update task error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → DELETE TASK
// ======================================================

router.delete(
  "/:id",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      const manager = await User.findById(req.user.id);

      await Activity.create({
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: "Deleted Task",
        description: `${manager.name} deleted task "${task.title}".`,
        type: "task",
        relatedProject: task.project,
        relatedTask: task._id,
      });

      await Task.findByIdAndDelete(req.params.id);
      await syncProjectProgress(task.project);

      res.json({
        message: "Task deleted successfully.",
      });
    } catch (error) {
      console.error("Delete task error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

module.exports = router;
