const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "General Information",
        "Meeting",
        "Holiday",
        "Salary / Payroll",
        "Office Notice",
        "Policy Update",
        "Training",
        "Event",
        "Urgent Notice",
      ],
      default: "General Information",
    },

    priority: {
      type: String,
      enum: ["Normal", "Important", "Urgent"],
      default: "Normal",
    },

    // Who created the announcement
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdByName: {
      type: String,
      required: true,
      trim: true,
    },

    createdByRole: {
      type: String,
      enum: ["manager", "hr"],
      required: true,
    },

    // Who should receive it
    audienceType: {
      type: String,
      enum: [
        "hr",
        "all-employees",
        "selected-employees",
      ],
      required: true,
    },

    // Used when selected-employees is chosen
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Optional meeting information
    meeting: {
      date: {
        type: Date,
        default: null,
      },

      startTime: {
        type: String,
        default: "",
      },

      endTime: {
        type: String,
        default: "",
      },

      mode: {
        type: String,
        enum: ["Virtual", "Office", ""],
        default: "",
      },

      meetingLink: {
        type: String,
        default: "",
        trim: true,
      },

      location: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // Optional related project
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    // Track who has read the announcement
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Announcement",
  announcementSchema
);