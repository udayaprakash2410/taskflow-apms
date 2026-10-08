const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Announcement = require("../models/Announcement");
const Notification = require("../models/Notification");
const Leave = require("../models/Leave");
const Activity = require("../models/Activity");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// VALIDATE MONGODB ID
// ======================================================

router.param("id", (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid user ID.",
    });
  }

  next();
});


// ======================================================
// GET ALL EMPLOYEES
// MANAGER + HR
// ======================================================

router.get(
  "/employees",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const employees = await User.find({
        role: "employee",
        isActive: true,
      }).select("-password");

      const result = employees.map((employee) => ({
        ...employee.toObject(),
        jobTitle: employee.jobTitle || "Employee",
      }));

      res.json(result);
    } catch (error) {
      console.error("Get employees error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// GET ALL HR USERS
// MANAGER ONLY
// ======================================================

router.get(
  "/hr",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const hrUsers = await User.find({
        role: "hr",
        isActive: true,
      }).select("-password");

      const result = hrUsers.map((hr) => ({
        ...hr.toObject(),

        // If an old HR account has "Employee"
        // as job title, display it correctly as HR.
        jobTitle:
          !hr.jobTitle || hr.jobTitle === "Employee"
            ? "HR"
            : hr.jobTitle,
      }));

      res.json(result);
    } catch (error) {
      console.error("Get HR error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// GET CURRENT USER
// ======================================================

router.get(
  "/me",
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Get current user error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// UPDATE CURRENT USER
// ======================================================

router.put(
  "/me",
  protect,
  async (req, res) => {
    try {
      const { name, email, jobTitle } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (name !== undefined) {
        user.name = name.trim();
      }

      if (email !== undefined) {
        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
          email: cleanEmail,
          _id: { $ne: user._id },
        });

        if (existingUser) {
          return res.status(400).json({
            message: "Email is already in use.",
          });
        }

        user.email = cleanEmail;
      }

      if (jobTitle !== undefined) {
        user.jobTitle = jobTitle.trim();
      }

      await user.save();

      res.json({
        message: "Profile updated successfully.",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          jobTitle: user.jobTitle,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// CHANGE PASSWORD
// ======================================================

router.put(
  "/me/password",
  protect,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Current password and new password are required.",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect.",
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);

      user.tokenVersion += 1;

      await user.save();

      res.json({
        message: "Password changed successfully.",
      });
    } catch (error) {
      console.error("Change password error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// UPDATE EMPLOYEE
// MANAGER + HR
// ======================================================

router.put(
  "/employees/:id",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const { name, email, jobTitle } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          message: "Name and email are required.",
        });
      }

      const employee = await User.findOne({
        _id: req.params.id,
        role: "employee",
        isActive: true,
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found.",
        });
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName || !cleanEmail) {
        return res.status(400).json({
          message: "Name and email cannot be empty.",
        });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(cleanEmail)) {
        return res.status(400).json({
          message: "Please enter a valid email address.",
        });
      }

      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: employee._id },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email is already in use.",
        });
      }

      employee.name = cleanName;
      employee.email = cleanEmail;
      employee.jobTitle = jobTitle?.trim() || "Employee";

      await employee.save();

      res.json({
        message: "Employee updated successfully.",
        employee: {
          _id: employee._id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          jobTitle: employee.jobTitle,
        },
      });
    } catch (error) {
      console.error("Update employee error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// DELETE EMPLOYEE
// MANAGER + HR
// ======================================================

router.delete(
  "/employees/:id",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const employee = await User.findOne({
        _id: req.params.id,
        role: "employee",
        isActive: true,
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found.",
        });
      }

      // Soft delete
      employee.isActive = false;

      // Invalidate existing tokens
      employee.tokenVersion += 1;

      await employee.save();

      // Remove from projects
      await Project.updateMany(
        { members: employee._id },
        {
          $pull: {
            members: employee._id,
          },
        }
      );

      // Unassign from tasks
      await Task.updateMany(
        { assignedTo: employee._id },
        {
          $set: {
            assignedTo: null,
            assignedToName: null,
          },
        }
      );

      // Remove from announcements
      await Announcement.updateMany(
        {},
        {
          $pull: {
            recipients: employee._id,
            readBy: employee._id,
          },
        }
      );

      // Remove notifications
      await Notification.deleteMany({
        user: employee._id,
      });

      // Remove activity read status
      await Activity.updateMany(
        {},
        {
          $pull: {
            readBy: employee._id,
          },
        }
      );

      res.json({
        message: "Employee deactivated successfully.",
      });
    } catch (error) {
      console.error("Delete employee error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// UPDATE HR
// MANAGER ONLY
// ======================================================

router.put(
  "/hr/:id",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const { name, email, jobTitle } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          message: "Name and email are required.",
        });
      }

      const hr = await User.findOne({
        _id: req.params.id,
        role: "hr",
        isActive: true,
      });

      if (!hr) {
        return res.status(404).json({
          message: "HR not found.",
        });
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName || !cleanEmail) {
        return res.status(400).json({
          message: "Name and email cannot be empty.",
        });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(cleanEmail)) {
        return res.status(400).json({
          message: "Please enter a valid email address.",
        });
      }

      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: hr._id },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email is already in use.",
        });
      }

      hr.name = cleanName;
      hr.email = cleanEmail;

      hr.jobTitle =
        jobTitle?.trim() || "HR";

      await hr.save();

      res.json({
        message: "HR updated successfully.",
        hr: {
          _id: hr._id,
          name: hr.name,
          email: hr.email,
          role: hr.role,
          jobTitle: hr.jobTitle,
        },
      });
    } catch (error) {
      console.error("Update HR error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// DELETE HR
// MANAGER ONLY
// ======================================================

router.delete(
  "/hr/:id",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const hr = await User.findOne({
        _id: req.params.id,
        role: "hr",
        isActive: true,
      });

      if (!hr) {
        return res.status(404).json({
          message: "HR not found.",
        });
      }

      // Soft delete
      hr.isActive = false;

      // Invalidate existing tokens
      hr.tokenVersion += 1;

      await hr.save();

      // Remove HR from projects if present
      await Project.updateMany(
        { members: hr._id },
        {
          $pull: {
            members: hr._id,
          },
        }
      );

      // Unassign HR from tasks if present
      await Task.updateMany(
        { assignedTo: hr._id },
        {
          $set: {
            assignedTo: null,
            assignedToName: null,
          },
        }
      );

      // Remove from announcements
      await Announcement.updateMany(
        {},
        {
          $pull: {
            recipients: hr._id,
            readBy: hr._id,
          },
        }
      );

      // Remove notifications
      await Notification.deleteMany({
        user: hr._id,
      });

      // Remove activity read status
      await Activity.updateMany(
        {},
        {
          $pull: {
            readBy: hr._id,
          },
        }
      );

      res.json({
        message: "HR deactivated successfully.",
      });
    } catch (error) {
      console.error("Delete HR error:", error);

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


module.exports = router;