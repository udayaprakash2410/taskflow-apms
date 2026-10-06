const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["manager", "hr", "employee"],
      required: true,
    },

    jobTitle: {
      type: String,
      default: "Employee",
      trim: true,
    },

    // Deactivation preserves historical assignments while immediately
    // revoking API access for a former employee.
    isActive: {
      type: Boolean,
      default: true,
    },

    // Incremented when credentials or account access change so old JWTs
    // cannot continue to be used.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
