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

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid user ID." });
  return next();
});


// ======================================================
// GET EMPLOYEES
// MANAGER + HR
// ======================================================

router.get(
  "/employees",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const employees = await User.find(
        { role: "employee", isActive: { $ne: false } },
        "-password"
      ).sort({ createdAt: -1 });

      res.json(
        employees.map((employee) => ({
          ...employee.toObject(),
          jobTitle: employee.jobTitle || "Employee",
        }))
      );
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ======================================================
// GET HR USERS
// MANAGER ONLY
// ======================================================

router.get(
  "/hr",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const hrUsers = await User.find(
        { role: "hr", isActive: { $ne: false } },
        "-password"
      ).sort({ createdAt: -1 });

      res.json(hrUsers);
    } catch (error) {
      console.error("Get HR users error:", error);
      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ======================================================
// GET CURRENT USER
// ======================================================

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id,
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Server error.",
    });
  }
});


// ======================================================
// UPDATE CURRENT USER PROFILE
// ======================================================

router.put("/me", protect, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Name and email cannot be empty.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already in use.",
      });
    }

    user.name = cleanName;
    user.email = cleanEmail;

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});


// ======================================================
// CHANGE CURRENT USER PASSWORD
// ======================================================

router.put("/me/password", protect, async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({
        message:
          "New password must be between 8 and 128 characters.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );
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
});


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
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found.",
        });
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName || !cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          message: "Name and email cannot be empty.",
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
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found.",
        });
      }

      // Preserve project, task, leave and activity history. Removing this
      // account from active membership prevents new assignments, while token
      // invalidation immediately ends any existing session.
      employee.isActive = false;
      employee.tokenVersion += 1;
      await employee.save();

      await Project.updateMany(
        { members: employee._id },
        { $pull: { members: employee._id } }
      );
      await Task.updateMany(
        { assignedTo: employee._id },
        { $set: { assignedTo: null, assignedToName: null } }
      );
      await Announcement.updateMany(
        {},
        { $pull: { recipients: employee._id, readBy: employee._id } }
      );
      await Notification.deleteMany({ user: employee._id });
      await Leave.updateMany(
        { employee: employee._id },
        { $set: { employeeName: `${employee.name} (deactivated)` } }
      );
      await Activity.updateMany({}, { $pull: { readBy: employee._id } });

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


module.exports = router;
