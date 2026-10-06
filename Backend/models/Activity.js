const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userRole: {
      type: String,
      enum: ["manager", "hr", "employee"],
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "user",
        "leave",
        "project",
        "task",
        "announcement",
        "system",
      ],
      default: "system",
    },

    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    relatedLeave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      default: null,
    },

    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    // Manager has read this activity
    managerRead: {
      type: Boolean,
      default: false,
    },

    // Employee has read this activity
    employeeRead: {
      type: Boolean,
      default: false,
    },

    // Read state is personal. Legacy booleans above are retained for
    // compatibility with existing data but are no longer used by routes.
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
