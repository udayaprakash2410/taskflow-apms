const express = require("express");
const mongoose = require("mongoose");

const Announcement = require("../models/Announcement");
const User = require("../models/User");
const Activity = require("../models/Activity");
const { canAccessAnnouncement } = require("../utils/announcementAccess");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid announcement ID." });
  return next();
});

// ======================================================
// CREATE ANNOUNCEMENT
// MANAGER → HR
// HR → EMPLOYEES
// ======================================================

router.post(
  "/",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const {
        title,
        message,
        type,
        priority,
        audienceType,
        recipients,
        meeting,
        relatedProject,
      } = req.body;

      if (typeof title !== "string" || !title.trim() || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
          message: "Title and message are required.",
        });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      // ==================================================
      // CHECK AUDIENCE PERMISSION
      // ==================================================

      // Manager can only send directly to HR
      if (
        user.role === "manager" &&
        audienceType !== "hr"
      ) {
        return res.status(403).json({
          message:
            "Manager can send announcements only to HR.",
        });
      }

      if (!['hr', 'all-employees', 'selected-employees'].includes(audienceType)) {
        return res.status(400).json({ message: "Invalid announcement audience." });
      }

      // HR cannot use the HR audience
      if (
        user.role === "hr" &&
        audienceType === "hr"
      ) {
        return res.status(403).json({
          message:
            "HR cannot send announcements to HR through this option.",
        });
      }

      // ==================================================
      // VALIDATE RECIPIENTS
      // ==================================================

      let validRecipients = [];

      if (audienceType === "selected-employees") {
        if (
          !Array.isArray(recipients) ||
          recipients.length === 0
        ) {
          return res.status(400).json({
            message:
              "Please select at least one employee.",
          });
        }

        const employees = await User.find({
          _id: { $in: recipients },
          role: "employee",
          isActive: { $ne: false },
        }).select("_id");

        validRecipients = employees.map(
          (employee) => employee._id
        );

        if (
          validRecipients.length !==
          recipients.length
        ) {
          return res.status(400).json({
            message:
              "One or more selected users are not valid employees.",
          });
        }
      }

      // ==================================================
      // CREATE ANNOUNCEMENT
      // ==================================================

      const announcement =
        await Announcement.create({
          title,
          message,

          type:
            type ||
            "General Information",

          priority:
            priority ||
            "Normal",

          createdBy: user._id,

          createdByName: user.name,

          createdByRole: user.role,

          audienceType,

          recipients: validRecipients,

          meeting: {
            date:
              meeting?.date || null,

            startTime:
              meeting?.startTime || "",

            endTime:
              meeting?.endTime || "",

            mode:
              meeting?.mode || "",

            meetingLink:
              meeting?.meetingLink || "",

            location:
              meeting?.location || "",
          },

          relatedProject:
            relatedProject || null,

          published: true,

          readBy: [],
        });

      // ==================================================
      // ACTIVITY LOG
      // ==================================================

      await Activity.create({
        user: user._id,

        userName: user.name,

        userRole: user.role,

        action: "Created Announcement",

        description:
          `${user.name} created announcement "${title}".`,

        type: "announcement",
      });

      // ==================================================
      // POPULATE RESPONSE
      // ==================================================

      const populatedAnnouncement =
        await Announcement.findById(
          announcement._id
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "recipients",
            "name email role"
          )
          .populate(
            "relatedProject",
            "name"
          );

      return res.status(201).json({
        message:
          "Announcement created successfully.",

        announcement:
          populatedAnnouncement,
      });
    } catch (error) {
      console.error(
        "Create announcement error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// GET ANNOUNCEMENTS
// MANAGER / HR / EMPLOYEE
// ======================================================

router.get(
  "/",
  protect,
  allowRoles(
    "manager",
    "hr",
    "employee"
  ),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findById(
        userId
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      let query = {
        published: true,
      };

      // ==================================================
      // MANAGER
      // ==================================================

      if (user.role === "manager") {
        query = {
          published: true,

          $or: [
            {
              createdBy: userId,
            },
            {
              audienceType: "hr",
            },
          ],
        };
      }

      // ==================================================
      // HR
      // ==================================================

      if (user.role === "hr") {
        query = {
          published: true,

          $or: [
            {
              audienceType: "hr",
            },
            {
              createdBy: userId,
            },
          ],
        };
      }

      // ==================================================
      // EMPLOYEE
      // ==================================================

      if (user.role === "employee") {
        query = {
          published: true,

          $or: [
            {
              audienceType:
                "all-employees",
            },

            {
              audienceType:
                "selected-employees",

              recipients: userId,
            },

            {
              createdBy: userId,
            },
          ],
        };
      }

      const announcements =
        await Announcement.find(query)
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "recipients",
            "name email role"
          )
          .populate(
            "relatedProject",
            "name"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(
        announcements
      );
    } catch (error) {
      console.error(
        "Get announcements error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// FORWARD ANNOUNCEMENT
// HR → EMPLOYEES
//
// HR can forward only a Manager-created announcement
// that was originally sent to HR.
//
// Original Manager announcement is NOT modified.
// A new employee-facing announcement is created.
// ======================================================

router.post(
  "/:id/forward",
  protect,
  allowRoles("hr"),
  async (req, res) => {
    try {
      const {
        audienceType,
        recipients,
      } = req.body;

      // ==================================================
      // FIND HR USER
      // ==================================================

      const user = await User.findById(
        req.user.id
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      // ==================================================
      // FIND ORIGINAL ANNOUNCEMENT
      // ==================================================

      const sourceAnnouncement =
        await Announcement.findById(
          req.params.id
        );

      if (!sourceAnnouncement) {
        return res.status(404).json({
          message:
            "Announcement not found.",
        });
      }

      if (!canAccessAnnouncement(sourceAnnouncement, req.user)) {
        return res.status(403).json({ message: "You are not allowed to access this announcement." });
      }

      // ==================================================
      // CHECK SOURCE ANNOUNCEMENT
      // ==================================================

      if (
        sourceAnnouncement.createdByRole !==
          "manager" ||
        sourceAnnouncement.audienceType !==
          "hr"
      ) {
        return res.status(403).json({
          message:
            "Only manager announcements sent to HR can be forwarded to employees.",
        });
      }

      // ==================================================
      // CHECK AUDIENCE
      // ==================================================

      if (
        ![
          "all-employees",
          "selected-employees",
        ].includes(audienceType)
      ) {
        return res.status(400).json({
          message:
            "Please choose All Employees or Selected Employees.",
        });
      }

      // ==================================================
      // VALIDATE EMPLOYEES
      // ==================================================

      let validRecipients = [];

      if (
        audienceType ===
        "selected-employees"
      ) {
        if (
          !Array.isArray(recipients) ||
          recipients.length === 0
        ) {
          return res.status(400).json({
            message:
              "Please select at least one employee.",
          });
        }

        const employees =
          await User.find({
          _id: {
            $in: recipients,
          },

          role: "employee",
          isActive: { $ne: false },
          }).select("_id");

        validRecipients =
          employees.map(
            (employee) =>
              employee._id
          );

        if (
          validRecipients.length !==
          recipients.length
        ) {
          return res.status(400).json({
            message:
              "One or more selected users are not valid employees.",
          });
        }
      }

      // ==================================================
      // CREATE EMPLOYEE COPY
      // ==================================================

      const forwardedAnnouncement =
        await Announcement.create({
          title:
            sourceAnnouncement.title,

          message:
            sourceAnnouncement.message,

          type:
            sourceAnnouncement.type,

          priority:
            sourceAnnouncement.priority,

          // Important:
          // Employee-facing copy belongs to HR
          createdBy: user._id,

          createdByName:
            user.name,

          createdByRole:
            "hr",

          audienceType,

          recipients:
            validRecipients,

          meeting: {
            date:
              sourceAnnouncement.meeting
                ?.date || null,

            startTime:
              sourceAnnouncement.meeting
                ?.startTime || "",

            endTime:
              sourceAnnouncement.meeting
                ?.endTime || "",

            mode:
              sourceAnnouncement.meeting
                ?.mode || "",

            meetingLink:
              sourceAnnouncement.meeting
                ?.meetingLink || "",

            location:
              sourceAnnouncement.meeting
                ?.location || "",
          },

          relatedProject:
            sourceAnnouncement.relatedProject ||
            null,

          published: true,

          readBy: [],
        });

      // ==================================================
      // ACTIVITY LOG
      // ==================================================

      await Activity.create({
        user: user._id,

        userName: user.name,

        userRole: user.role,

        action:
          "Forwarded Announcement",

        description:
          `${user.name} forwarded announcement "${sourceAnnouncement.title}" to employees.`,

        type: "announcement",
      });

      // ==================================================
      // POPULATE RESPONSE
      // ==================================================

      const populatedAnnouncement =
        await Announcement.findById(
          forwardedAnnouncement._id
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "recipients",
            "name email role"
          )
          .populate(
            "relatedProject",
            "name"
          );

      return res.status(201).json({
        message:
          "Announcement sent to employees successfully.",

        announcement:
          populatedAnnouncement,
      });
    } catch (error) {
      console.error(
        "Forward announcement error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// GET UNREAD COUNT
//
// IMPORTANT:
// This route MUST come before GET "/:id"
// Otherwise Express can treat "unread" as an ID.
// ======================================================

router.get(
  "/unread/count",
  protect,
  allowRoles(
    "manager",
    "hr",
    "employee"
  ),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findById(
        userId
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      // ==================================================
      // BASE QUERY
      //
      // readBy $ne means:
      // current user's ID is NOT inside readBy
      // ==================================================

      let query = {
        published: true,

        readBy: {
          $ne: userId,
        },
      };

      // ==================================================
      // MANAGER UNREAD
      // ==================================================

      if (user.role === "manager") {
        query.$or = [
          {
            createdBy: userId,
          },

          {
            audienceType: "hr",
          },
        ];
      }

      // ==================================================
      // HR UNREAD
      // ==================================================

      if (user.role === "hr") {
        query.$or = [
          {
            audienceType: "hr",
          },

          {
            createdBy: userId,
          },
        ];
      }

      // ==================================================
      // EMPLOYEE UNREAD
      // ==================================================

      if (user.role === "employee") {
        query.$or = [
          {
            audienceType:
              "all-employees",
          },

          {
            audienceType:
              "selected-employees",

            recipients: userId,
          },
        ];
      }

      const count =
        await Announcement.countDocuments(
          query
        );

      return res.json({
        count,
      });
    } catch (error) {
      console.error(
        "Announcement unread count error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// GET SINGLE ANNOUNCEMENT
// ======================================================

router.get(
  "/:id",
  protect,
  allowRoles(
    "manager",
    "hr",
    "employee"
  ),
  async (req, res) => {
    try {
      const announcement =
        await Announcement.findById(
          req.params.id
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "recipients",
            "name email role"
          )
          .populate(
            "relatedProject",
            "name"
          );

      if (!announcement) {
        return res.status(404).json({
          message:
            "Announcement not found.",
        });
      }

      if (!canAccessAnnouncement(announcement, req.user)) {
        return res.status(403).json({
          message:
            "You are not allowed to view this announcement.",
        });
      }

      return res.json(
        announcement
      );
    } catch (error) {
      console.error(
        "Get announcement error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MARK ANNOUNCEMENT AS READ
// ======================================================

router.put(
  "/:id/read",
  protect,
  allowRoles(
    "manager",
    "hr",
    "employee"
  ),
  async (req, res) => {
    try {
      const announcement =
        await Announcement.findById(
          req.params.id
        );

      if (!announcement) {
        return res.status(404).json({
          message:
            "Announcement not found.",
        });
      }

      if (!canAccessAnnouncement(announcement, req.user)) {
        return res.status(403).json({ message: "You are not allowed to access this announcement." });
      }

      // ==================================================
      // CHECK IF ALREADY READ
      // ==================================================

      const alreadyRead =
        announcement.readBy.some(
          (userId) =>
            userId.toString() ===
            req.user.id.toString()
        );

      // ==================================================
      // ADD CURRENT USER TO readBy
      // ==================================================

      if (!alreadyRead) {
        announcement.readBy.push(
          req.user.id
        );

        await announcement.save();
      }

      // ==================================================
      // RETURN UPDATED ANNOUNCEMENT
      // ==================================================

      const updatedAnnouncement =
        await Announcement.findById(
          announcement._id
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "recipients",
            "name email role"
          )
          .populate(
            "relatedProject",
            "name"
          );

      return res.json({
        message:
          "Announcement marked as read.",

        announcement:
          updatedAnnouncement,
      });
    } catch (error) {
      console.error(
        "Mark announcement read error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// UPDATE ANNOUNCEMENT
// MANAGER / HR
// ======================================================

router.put(
  "/:id",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const announcement =
        await Announcement.findById(
          req.params.id
        );

      if (!announcement) {
        return res.status(404).json({
          message:
            "Announcement not found.",
        });
      }

      // ==================================================
      // ONLY CREATOR CAN EDIT
      // ==================================================

      if (
        announcement.createdBy.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "Only the creator can edit this announcement.",
        });
      }

      const {
        title,
        message,
        type,
        priority,
        audienceType,
        recipients,
        meeting,
        relatedProject,
      } = req.body;

      const nextAudience = audienceType ?? announcement.audienceType;
      // Preserve the creator/audience policy on every update. This prevents a
      // manager announcement from being repurposed for employees and prevents
      // HR from altering manager-owned HR notices.
      if (
        (req.user.role === "manager" && nextAudience !== "hr") ||
        (req.user.role === "hr" && !["all-employees", "selected-employees"].includes(nextAudience))
      ) {
        return res.status(403).json({ message: "You cannot use that announcement audience." });
      }

      if ((title !== undefined && (typeof title !== "string" || !title.trim())) ||
          (message !== undefined && (typeof message !== "string" || !message.trim()))) {
        return res.status(400).json({ message: "Title and message cannot be empty." });
      }

      // ==================================================
      // UPDATE BASIC FIELDS
      // ==================================================

      announcement.title =
        title ?? announcement.title;

      announcement.message =
        message ?? announcement.message;

      announcement.type =
        type ?? announcement.type;

      announcement.priority =
        priority ?? announcement.priority;

      announcement.audienceType =
        audienceType ??
        announcement.audienceType;

      // ==================================================
      // SELECTED EMPLOYEES
      // ==================================================

      if (
        audienceType ===
        "selected-employees"
      ) {
        if (
          !Array.isArray(recipients) ||
          recipients.length === 0
        ) {
          return res.status(400).json({
            message:
              "Please select at least one employee.",
          });
        }

        const employees =
          await User.find({
          _id: {
            $in: recipients,
          },

          role: "employee",
          isActive: { $ne: false },
          }).select("_id");

        if (
          employees.length !==
          recipients.length
        ) {
          return res.status(400).json({
            message:
              "One or more selected users are not valid employees.",
          });
        }

        announcement.recipients =
          employees.map(
            (employee) =>
              employee._id
          );
      }

      // ==================================================
      // ALL EMPLOYEES
      // ==================================================

      if (
        audienceType ===
        "all-employees"
      ) {
        announcement.recipients = [];
      }

      // ==================================================
      // HR
      // ==================================================

      if (
        audienceType === "hr"
      ) {
        announcement.recipients = [];
      }

      // ==================================================
      // MEETING
      // ==================================================

      if (meeting) {
        announcement.meeting = {
          date:
            meeting.date || null,

          startTime:
            meeting.startTime || "",

          endTime:
            meeting.endTime || "",

          mode:
            meeting.mode || "",

          meetingLink:
            meeting.meetingLink || "",

          location:
            meeting.location || "",
        };
      }

      // ==================================================
      // PROJECT
      // ==================================================

      announcement.relatedProject =
        relatedProject ??
        announcement.relatedProject;

      // ==================================================
      // IMPORTANT
      // If announcement is edited,
      // everyone should see it as unread again.
      // ==================================================

      announcement.readBy = [];

      await announcement.save();

      // ==================================================
      // POPULATE UPDATED ANNOUNCEMENT
      // ==================================================

      const updated =
        await Announcement.findById(
          announcement._id
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "recipients",
            "name email role"
          )
          .populate(
            "relatedProject",
            "name"
          );

      return res.json({
        message:
          "Announcement updated successfully.",

        announcement: updated,
      });
    } catch (error) {
      console.error(
        "Update announcement error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// DELETE ANNOUNCEMENT
// ======================================================

router.delete(
  "/:id",
  protect,
  allowRoles("manager", "hr"),
  async (req, res) => {
    try {
      const announcement =
        await Announcement.findById(
          req.params.id
        );

      if (!announcement) {
        return res.status(404).json({
          message:
            "Announcement not found.",
        });
      }

      // ==================================================
      // ONLY CREATOR CAN DELETE
      // ==================================================

      if (
        announcement.createdBy.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "Only the creator can delete this announcement.",
        });
      }

      const title =
        announcement.title;

      // ==================================================
      // DELETE
      // ==================================================

      await announcement.deleteOne();

      // ==================================================
      // ACTIVITY LOG
      // ==================================================

      const user =
        await User.findById(
          req.user.id
        );

      if (user) {
        await Activity.create({
          user: user._id,

          userName: user.name,

          userRole: user.role,

          action:
            "Deleted Announcement",

          description:
            `${user.name} deleted announcement "${title}".`,

          type: "announcement",
        });
      }

      return res.json({
        message:
          "Announcement deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete announcement error:",
        error
      );

      return res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

module.exports = router;
