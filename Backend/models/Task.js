const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Not Started",
        "To Do",
        "In Progress",
        "Review",
        "Completed",
      ],
      default: "Not Started",
    },

    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
      ],
      default: "Medium",
    },

    startDate: {
      type: Date,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

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

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedToName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Task",
  taskSchema
);
