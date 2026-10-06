const express = require("express");
const mongoose = require("mongoose");

const Project = require("../models/Project");
const User = require("../models/User");
const Activity = require("../models/Activity");
const {
  syncProjectProgress,
  calculateProjectProgress,
} = require("../utils/projectProgress");
const Task = require("../models/Task");
const Announcement = require("../models/Announcement");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid project ID." });
  return next();
});

// ======================================================
// MANAGER → CREATE PROJECT
// ======================================================

router.post(
  "/",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
      } = req.body;

      if (
        typeof name !== "string" || !name.trim() ||
        typeof description !== "string" || !description.trim() ||
        !startDate ||
        !dueDate
      ) {
        return res.status(400).json({
          message: "Please fill all required fields.",
        });
      }

      const manager = await User.findById(req.user.id);

      if (!manager) {
        return res.status(404).json({
          message: "Manager not found.",
        });
      }

      const start = new Date(startDate);
      const due = new Date(dueDate);

      if (
        isNaN(start.getTime()) ||
        isNaN(due.getTime())
      ) {
        return res.status(400).json({
          message: "Invalid project date.",
        });
      }

      if (due < start) {
        return res.status(400).json({
          message:
            "Due date cannot be before start date.",
        });
      }

      const project = await Project.create({
        name,
        description,
        status: status || "Planning",
        progress: 0,
        priority: priority || "Medium",
        startDate: start,
        dueDate: due,
        createdBy: manager._id,
        createdByName: manager.name,
        members: [],
      });

      await Activity.create({
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: "Created Project",
        description: `${manager.name} created project "${project.name}".`,
        type: "project",
        relatedProject: project._id,
      });

      res.status(201).json({
        message: "Project created successfully.",
        project,
      });
    } catch (error) {
      console.error(
        "Create project error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER + HR → VIEW ALL PROJECTS
// Used by Analytics
// ======================================================

router.get(
  "/",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const projects = await Project.find()
        .sort({ createdAt: -1 })
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "members",
          "name email role"
        );

      const progressValues = await Promise.all(
        projects.map((project) =>
          calculateProjectProgress(project._id)
        )
      );

      projects.forEach((project, index) => {
        project.progress = progressValues[index].progress;
      });

      res.json(projects);
    } catch (error) {
      console.error(
        "Get projects error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// EMPLOYEE → VIEW ASSIGNED PROJECTS
// ======================================================

router.get(
  "/my",
  protect,
  allowRoles("employee"),
  async (req, res) => {
    try {
      const projects = await Project.find({
        members: req.user.id,
      })
        .sort({ createdAt: -1 })
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "members",
          "name email role"
        );

      const progressValues = await Promise.all(
        projects.map((project) =>
          calculateProjectProgress(project._id)
        )
      );

      projects.forEach((project, index) => {
        project.progress = progressValues[index].progress;
      });

      res.json(projects);
    } catch (error) {
      console.error(
        "Get my projects error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → ASSIGN EMPLOYEE TO PROJECT
// ======================================================

router.put(
  "/:id/members",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const { employeeId } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          message: "Employee ID is required.",
        });
      }

      const project = await Project.findById(
        req.params.id
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      const employee = await User.findById(
        employeeId
      );

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found.",
        });
      }

      if (employee.role !== "employee" || employee.isActive === false) {
        return res.status(400).json({
          message:
            "Only employees can be assigned to a project.",
        });
      }

      const alreadyAssigned =
        project.members.some(
          (memberId) =>
            memberId.toString() ===
            employeeId.toString()
        );

      if (alreadyAssigned) {
        return res.status(400).json({
          message:
            "Employee is already assigned to this project.",
        });
      }

      project.members.push(employeeId);

      await project.save();

      const manager = await User.findById(
        req.user.id
      );

      await Activity.create({
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: "Assigned Employee",
        description: `${manager.name} assigned ${employee.name} to project "${project.name}".`,
        type: "project",
        relatedProject: project._id,
      });

      const updatedProject =
        await Project.findById(project._id)
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "members",
            "name email role"
          );

      res.json({
        message:
          "Employee assigned successfully.",
        project: updatedProject,
      });
    } catch (error) {
      console.error(
        "Assign employee error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER + EMPLOYEE → GET SINGLE PROJECT
// ======================================================

router.get(
  "/:id",
  protect,
  allowRoles("manager", "employee"),
  async (req, res) => {
    try {
      const project = await Project.findById(
        req.params.id
      )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "members",
          "name email role"
        );

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      // Employee can only view projects
      // they are assigned to.
      if (
        req.user.role === "employee" &&
        !project.members.some(
          (member) =>
            member._id.toString() ===
            req.user.id
        )
      ) {
        return res.status(403).json({
          message:
            "You are not assigned to this project.",
        });
      }

      const { progress } = await calculateProjectProgress(project._id);
      project.progress = progress;

      res.json(project);
    } catch (error) {
      console.error(
        "Get project error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → UPDATE PROJECT
// ======================================================

router.put(
  "/:id",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
      } = req.body;

      const project = await Project.findById(
        req.params.id
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      if (
        startDate &&
        dueDate &&
        new Date(dueDate) <
          new Date(startDate)
      ) {
        return res.status(400).json({
          message:
            "Due date cannot be before start date.",
        });
      }

      project.name =
        name ?? project.name;

      project.description =
        description ?? project.description;

      project.priority =
        priority ?? project.priority;

      if (status !== undefined) {
        if (!Project.schema.path("status").enumValues.includes(status)) {
          return res.status(400).json({ message: "Invalid project status." });
        }
        project.status = status;
      }

      if (name !== undefined && (!String(name).trim() || String(name).trim().length > 150)) {
        return res.status(400).json({ message: "Project name must be between 1 and 150 characters." });
      }
      if (description !== undefined && (!String(description).trim() || String(description).trim().length > 5000)) {
        return res.status(400).json({ message: "Project description must be between 1 and 5000 characters." });
      }

      project.startDate =
        startDate ?? project.startDate;

      project.dueDate =
        dueDate ?? project.dueDate;

      await project.save();
      const syncedProject = await syncProjectProgress(project._id);

      const manager = await User.findById(
        req.user.id
      );

      await Activity.create({
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: "Updated Project",
        description: `${manager.name} updated project "${project.name}".`,
        type: "project",
        relatedProject: project._id,
      });

      res.json({
        message:
          "Project updated successfully.",
        project: syncedProject,
      });
    } catch (error) {
      console.error(
        "Update project error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → DELETE PROJECT
// ======================================================

router.delete(
  "/:id",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const project = await Project.findById(
        req.params.id
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      const manager = await User.findById(
        req.user.id
      );

      const projectName = project.name;

      // Delete only records scoped to this project. The activity log entries
      // are project-specific and task records cannot remain without a project.
      const tasks = await Task.find({ project: project._id }).select("_id");
      const taskIds = tasks.map((task) => task._id);
      await Promise.all([
        Task.deleteMany({ project: project._id }),
        Announcement.deleteMany({ relatedProject: project._id }),
        Activity.deleteMany({
          $or: [
            { relatedProject: project._id },
            ...(taskIds.length ? [{ relatedTask: { $in: taskIds } }] : []),
          ],
        }),
      ]);
      await project.deleteOne();

      await Activity.create({
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: "Deleted Project",
        description: `${manager.name} deleted project "${projectName}".`,
        type: "project",
      });

      res.json({
        message:
          "Project deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

module.exports = router;
