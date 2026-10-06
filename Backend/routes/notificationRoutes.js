const express = require("express");
const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid notification ID." });
  return next();
});

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

router.get(
  "/",
  protect,
  allowRoles("employee", "hr", "manager"),
  async (req, res) => {
    try {
      const notifications = await Notification.find({
        user: req.user.id,
      })
        .populate("relatedLeave")
        .sort({ createdAt: -1 });

      res.json(notifications);
    } catch (error) {
      console.error(
        "Get notifications error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ==========================================
// GET UNREAD COUNT
// ==========================================

router.get(
  "/unread-count",
  protect,
  allowRoles("employee", "hr", "manager"),
  async (req, res) => {
    try {
      const count = await Notification.countDocuments({
        user: req.user.id,
        isRead: false,
      });

      res.json({
        count,
      });
    } catch (error) {
      console.error(
        "Unread notification count error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ==========================================
// MARK ONE NOTIFICATION AS READ
// ==========================================

router.put(
  "/:id/read",
  protect,
  allowRoles("employee", "hr", "manager"),
  async (req, res) => {
    try {
      const notification =
        await Notification.findOne({
          _id: req.params.id,
          user: req.user.id,
        });

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found.",
        });
      }

      notification.isRead = true;

      await notification.save();

      res.json({
        message: "Notification marked as read.",
        notification,
      });
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================

router.put(
  "/read-all",
  protect,
  allowRoles("employee", "hr", "manager"),
  async (req, res) => {
    try {
      await Notification.updateMany(
        {
          user: req.user.id,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        }
      );

      res.json({
        message:
          "All notifications marked as read.",
      });
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

module.exports = router;
