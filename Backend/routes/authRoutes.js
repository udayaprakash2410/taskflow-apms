const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Activity = require("../models/Activity");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validAccountInput = ({ name, email, password }) =>
  typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 100 &&
  typeof email === "string" && emailPattern.test(email.trim()) &&
  typeof password === "string" && password.length >= 8 && password.length <= 128;

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user || user.isActive === false) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// ======================================================
// MANAGER → ADD HR
// POST /api/auth/manager/add-hr
// ======================================================

router.post(
  "/manager/add-hr",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        jobTitle,
      } = req.body;

      if (!validAccountInput({ name, email, password })) {
        return res.status(400).json({
          message:
            "Enter a valid name, email and password of at least 8 characters.",
        });
      }

      const normalizedEmail = email
        .toLowerCase()
        .trim();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          message:
            "A user with this email already exists.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const hr = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "hr",
        jobTitle: jobTitle?.trim() || "Employee",
      });

      // CREATE ACTIVITY
      const manager = await User.findById(
        req.user.id
      );

      if (manager) {
        await Activity.create({
          user: manager._id,
          userName: manager.name,
          userRole: manager.role,
          action: "Added HR",
          description: `${manager.name} added ${hr.name} as an HR member.`,
          type: "user",
          relatedUser: hr._id,
        });
      }

      res.status(201).json({
        message: "HR added successfully.",

        user: {
          id: hr._id,
          name: hr.name,
          email: hr.email,
          role: hr.role,
          jobTitle: hr.jobTitle,
        },
      });
    } catch (error) {
      console.error(
        "Add HR error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// MANAGER → ADD EMPLOYEE
// POST /api/auth/manager/add-employee
// ======================================================

router.post(
  "/manager/add-employee",
  protect,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        jobTitle,
      } = req.body;

      if (!validAccountInput({ name, email, password })) {
        return res.status(400).json({
          message:
            "Enter a valid name, email and password of at least 8 characters.",
        });
      }

      const normalizedEmail = email
        .toLowerCase()
        .trim();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          message:
            "A user with this email already exists.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const employee =
        await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "employee",
          jobTitle: jobTitle?.trim() || "Employee",
        });

      // CREATE ACTIVITY
      const manager = await User.findById(
        req.user.id
      );

      if (manager) {
        await Activity.create({
          user: manager._id,
          userName: manager.name,
          userRole: manager.role,
          action: "Added Employee",
          description: `${manager.name} added ${employee.name} as an employee.`,
          type: "user",
          relatedUser: employee._id,
        });
      }

      res.status(201).json({
        message:
          "Employee added successfully.",

        user: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          jobTitle: employee.jobTitle,
        },
      });
    } catch (error) {
      console.error(
        "Add employee error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

// ======================================================
// HR → ADD EMPLOYEE
// POST /api/auth/hr/add-employee
// ======================================================

router.post(
  "/hr/add-employee",
  protect,
  allowRoles("hr"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        jobTitle,
      } = req.body;

      if (!validAccountInput({ name, email, password })) {
        return res.status(400).json({
          message:
            "Enter a valid name, email and password of at least 8 characters.",
        });
      }

      const normalizedEmail = email
        .toLowerCase()
        .trim();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          message:
            "A user with this email already exists.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const employee =
        await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "employee",
          jobTitle: jobTitle?.trim() || "Employee",
        });

      // CREATE ACTIVITY
      const hr = await User.findById(
        req.user.id
      );

      if (hr) {
        await Activity.create({
          user: hr._id,
          userName: hr.name,
          userRole: hr.role,
          action: "Added Employee",
          description: `${hr.name} added ${employee.name} as an employee.`,
          type: "user",
          relatedUser: employee._id,
        });
      }

      res.status(201).json({
        message:
          "Employee added successfully.",

        user: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          jobTitle: employee.jobTitle,
        },
      });
    } catch (error) {
      console.error(
        "HR add employee error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);

module.exports = router;
