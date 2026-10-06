const express = require("express");

const Activity = require("../models/Activity");
const Project = require("../models/Project");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// GET ACTIVITIES
// MANAGER + EMPLOYEE
// ======================================================

router.get(
  "/",
  protect,
  allowRoles("manager", "employee"),
  async (req, res) => {
    try {
      let activities = [];

      // ==================================================
      // MANAGER
      // ==================================================

      if (req.user.role === "manager") {
        activities = await Activity.find({
          user: { $ne: req.user.id },
        })
          .sort({ createdAt: -1 })
          .populate("user", "name email role")
          .populate("relatedUser", "name email role")
          .populate(
            "relatedLeave",
            "leaveType startDate endDate status"
          )
          .populate(
            "relatedProject",
            "name status priority"
          )
          .populate(
            "relatedTask",
            "title status priority"
          );
      }

      // ==================================================
      // EMPLOYEE
      // ==================================================

      if (req.user.role === "employee") {
        const employeeProjects = await Project.find({
          members: req.user.id,
        }).select("_id");

        const projectIds = employeeProjects.map(
          (project) => project._id
        );

        activities = await Activity.find({
          $or: [
            {
              user: req.user.id,
            },
            {
              relatedProject: {
                $in: projectIds,
              },
            },
          ],
        })
          .sort({ createdAt: -1 })
          .populate("user", "name email role")
          .populate("relatedUser", "name email role")
          .populate(
            "relatedLeave",
            "leaveType startDate endDate status"
          )
          .populate(
            "relatedProject",
            "name status priority"
          )
          .populate(
            "relatedTask",
            "title status priority"
          );
      }

      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// GET PROJECT-SPECIFIC ACTIVITIES
// MANAGER + EMPLOYEE
// ======================================================

router.get(
  "/project/:projectId",
  protect,
  allowRoles("manager", "employee"),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      // ==================================================
      // FIND PROJECT
      // ==================================================

      const project = await Project.findById(projectId).select(
        "_id name members createdBy"
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      // ==================================================
      // EMPLOYEE ACCESS CHECK
      // ==================================================

      if (req.user.role === "employee") {
        const isMember = project.members.some(
          (memberId) =>
            memberId.toString() === req.user.id.toString()
        );

        if (!isMember) {
          return res.status(403).json({
            message: "You are not a member of this project.",
          });
        }
      }

      // ==================================================
      // GET PROJECT ACTIVITIES
      // ==================================================

      const activities = await Activity.find({
        relatedProject: projectId,
      })
        .sort({ createdAt: -1 })
        .populate("user", "name email role")
        .populate("relatedUser", "name email role")
        .populate(
          "relatedLeave",
          "leaveType startDate endDate status"
        )
        .populate(
          "relatedProject",
          "name status priority"
        )
        .populate(
          "relatedTask",
          "title status priority"
        );

      res.json(activities);
    } catch (error) {
      console.error(
        "Get project activities error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// UNREAD ACTIVITY COUNT
// ======================================================

router.get(
  "/unread-count",
  protect,
  allowRoles("manager", "employee"),
  async (req, res) => {
    try {
      let count = 0;

      // ==================================================
      // MANAGER UNREAD ACTIVITIES
      // ==================================================

      if (req.user.role === "manager") {
        count = await Activity.countDocuments({
          user: {
            $ne: req.user.id,
          },

          $or: [
            {
              managerRead: false,
            },
            {
              managerRead: {
                $exists: false,
              },
            },
          ],
        });
      }

      // ==================================================
      // EMPLOYEE UNREAD ACTIVITIES
      // ==================================================

      if (req.user.role === "employee") {
        const employeeProjects = await Project.find({
          members: req.user.id,
        }).select("_id");

        const projectIds = employeeProjects.map(
          (project) => project._id
        );

        count = await Activity.countDocuments({
          user: {
            $ne: req.user.id,
          },

          relatedProject: {
            $in: projectIds,
          },

          $or: [
            {
              employeeRead: false,
            },
            {
              employeeRead: {
                $exists: false,
              },
            },
          ],
        });
      }

      res.json({
        count,
      });
    } catch (error) {
      console.error(
        "Get unread activity count error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MARK ACTIVITIES AS READ
// ======================================================

router.put(
  "/mark-read",
  protect,
  allowRoles("manager", "employee"),
  async (req, res) => {
    try {
      // ==================================================
      // MANAGER
      // ==================================================

      if (req.user.role === "manager") {
        await Activity.updateMany(
          {
            user: {
              $ne: req.user.id,
            },

            $or: [
              {
                managerRead: false,
              },
              {
                managerRead: {
                  $exists: false,
                },
              },
            ],
          },
          {
            $set: {
              managerRead: true,
            },
          }
        );
      }

      // ==================================================
      // EMPLOYEE
      // ==================================================

      if (req.user.role === "employee") {
        const employeeProjects = await Project.find({
          members: req.user.id,
        }).select("_id");

        const projectIds = employeeProjects.map(
          (project) => project._id
        );

        await Activity.updateMany(
          {
            user: {
              $ne: req.user.id,
            },

            relatedProject: {
              $in: projectIds,
            },

            $or: [
              {
                employeeRead: false,
              },
              {
                employeeRead: {
                  $exists: false,
                },
              },
            ],
          },
          {
            $set: {
              employeeRead: true,
            },
          }
        );
      }

      res.json({
        message: "Activities marked as read.",
      });
    } catch (error) {
      console.error(
        "Mark activities read error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// DASHBOARD ACTIVITIES
// ======================================================

router.get(
  "/dashboard",
  protect,
  allowRoles("manager", "hr", "employee"),
  async (req, res) => {
    try {
      let activities = [];

      // ==================================================
      // MANAGER
      // ==================================================

      if (req.user.role === "manager") {
        activities = await Activity.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name email role")
          .populate("relatedUser", "name email role")
          .populate(
            "relatedLeave",
            "leaveType startDate endDate status"
          )
          .populate(
            "relatedProject",
            "name status priority"
          )
          .populate(
            "relatedTask",
            "title status priority"
          );
      }

      // ==================================================
      // HR
      // ==================================================

      else if (req.user.role === "hr") {
        activities = await Activity.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name email role")
          .populate("relatedUser", "name email role")
          .populate(
            "relatedLeave",
            "leaveType startDate endDate status"
          )
          .populate(
            "relatedProject",
            "name status priority"
          )
          .populate(
            "relatedTask",
            "title status priority"
          );
      }

      // ==================================================
      // EMPLOYEE
      // ==================================================

      else if (req.user.role === "employee") {
        const employeeProjects = await Project.find({
          members: req.user.id,
        }).select("_id");

        const projectIds = employeeProjects.map(
          (project) => project._id
        );

        activities = await Activity.find({
          $or: [
            {
              user: req.user.id,
            },
            {
              relatedProject: {
                $in: projectIds,
              },
            },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name email role")
          .populate("relatedUser", "name email role")
          .populate(
            "relatedLeave",
            "leaveType startDate endDate status"
          )
          .populate(
            "relatedProject",
            "name status priority"
          )
          .populate(
            "relatedTask",
            "title status priority"
          );
      }

      res.json(activities);
    } catch (error) {
      console.error(
        "Get dashboard activities error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

module.exports = router;