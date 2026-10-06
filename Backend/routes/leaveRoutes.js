const express = require("express");

const Leave = require("../models/Leave");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// EMPLOYEE → APPLY FOR LEAVE
// POST /api/leaves
// ======================================================

router.post(
  "/",
  protect,
  allowRoles("employee"),
  async (req, res) => {
    try {
      const {
        leaveType,
        startDate,
        endDate,
        reason,
      } = req.body;

      if (
        !leaveType ||
        !startDate ||
        !endDate ||
        !reason
      ) {
        return res.status(400).json({
          message: "Please fill all leave fields.",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (
        isNaN(start.getTime()) ||
        isNaN(end.getTime())
      ) {
        return res.status(400).json({
          message: "Invalid date.",
        });
      }

      if (end < start) {
        return res.status(400).json({
          message:
            "End date cannot be before start date.",
        });
      }

      const employee = await User.findById(
        req.user.id
      );

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found.",
        });
      }

      // CREATE LEAVE
      const leave = await Leave.create({
        employee: employee._id,
        employeeName: employee.name,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        status: "Pending",
      });

      // CREATE ACTIVITY
      await Activity.create({
        user: employee._id,
        userName: employee.name,
        userRole: employee.role,
        action: "Applied for Leave",
        description: `${employee.name} applied for ${leaveType}.`,
        type: "leave",
        relatedUser: employee._id,
        relatedLeave: leave._id,
      });

      res.status(201).json({
        message:
          "Leave request submitted successfully.",
        leave,
      });
    } catch (error) {
      console.error(
        "Apply leave error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// EMPLOYEE → VIEW OWN LEAVES
// GET /api/leaves/my
// ======================================================

router.get(
  "/my",
  protect,
  allowRoles("employee"),
  async (req, res) => {
    try {
      const leaves = await Leave.find({
        employee: req.user.id,
      })
        .sort({ createdAt: -1 })
        .populate(
          "decidedBy",
          "name email"
        );

      res.json(leaves);
    } catch (error) {
      console.error(
        "My leaves error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// HR + MANAGER → VIEW ALL LEAVES
// GET /api/leaves
// ======================================================

router.get(
  "/",
  protect,
  allowRoles("hr", "manager"),
  async (req, res) => {
    try {
      const leaves = await Leave.find()
        .sort({ createdAt: -1 })
        .populate(
          "employee",
          "name email role"
        )
        .populate(
          "decidedBy",
          "name email role"
        );

      res.json(leaves);
    } catch (error) {
      console.error(
        "All leaves error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// HR → APPROVE LEAVE
// PUT /api/leaves/:id/approve
// ======================================================

router.put(
  "/:id/approve",
  protect,
  allowRoles("hr"),
  async (req, res) => {
    try {
      const leave = await Leave.findById(
        req.params.id
      );

      if (!leave) {
        return res.status(404).json({
          message:
            "Leave request not found.",
        });
      }

      if (leave.status !== "Pending") {
        return res.status(400).json({
          message:
            "Only pending leave requests can be approved.",
        });
      }

      const hr = await User.findById(
        req.user.id
      );

      if (!hr) {
        return res.status(404).json({
          message: "HR user not found.",
        });
      }

      // UPDATE LEAVE
      leave.status = "Approved";
      leave.decidedBy = hr._id;
      leave.decidedByName = hr.name;
      leave.decisionDate = new Date();

      await leave.save();

      // CREATE NOTIFICATION
      await Notification.create({
        user: leave.employee,
        title: "Leave Approved",
        message: `Your ${leave.leaveType} request has been approved by ${hr.name}.`,
        type: "leave",
        relatedLeave: leave._id,
        isRead: false,
      });

      // CREATE ACTIVITY
      await Activity.create({
        user: hr._id,
        userName: hr.name,
        userRole: hr.role,
        action: "Approved Leave",
        description: `${hr.name} approved ${leave.employeeName}'s ${leave.leaveType} request.`,
        type: "leave",
        relatedUser: leave.employee,
        relatedLeave: leave._id,
      });

      res.json({
        message:
          "Leave approved successfully.",
        leave,
      });
    } catch (error) {
      console.error(
        "Approve leave error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// HR → REJECT LEAVE
// PUT /api/leaves/:id/reject
// ======================================================

router.put(
  "/:id/reject",
  protect,
  allowRoles("hr"),
  async (req, res) => {
    try {
      const leave = await Leave.findById(
        req.params.id
      );

      if (!leave) {
        return res.status(404).json({
          message:
            "Leave request not found.",
        });
      }

      if (leave.status !== "Pending") {
        return res.status(400).json({
          message:
            "Only pending leave requests can be rejected.",
        });
      }

      const hr = await User.findById(
        req.user.id
      );

      if (!hr) {
        return res.status(404).json({
          message: "HR user not found.",
        });
      }

      // UPDATE LEAVE
      leave.status = "Rejected";
      leave.decidedBy = hr._id;
      leave.decidedByName = hr.name;
      leave.decisionDate = new Date();

      await leave.save();

      // CREATE NOTIFICATION
      await Notification.create({
        user: leave.employee,
        title: "Leave Rejected",
        message: `Your ${leave.leaveType} request has been rejected by ${hr.name}.`,
        type: "leave",
        relatedLeave: leave._id,
        isRead: false,
      });

      // CREATE ACTIVITY
      await Activity.create({
        user: hr._id,
        userName: hr.name,
        userRole: hr.role,
        action: "Rejected Leave",
        description: `${hr.name} rejected ${leave.employeeName}'s ${leave.leaveType} request.`,
        type: "leave",
        relatedUser: leave.employee,
        relatedLeave: leave._id,
      });

      res.json({
        message:
          "Leave rejected successfully.",
        leave,
      });
    } catch (error) {
      console.error(
        "Reject leave error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

module.exports = router;