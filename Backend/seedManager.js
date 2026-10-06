const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

dotenv.config();

const createManager = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingManager = await User.findOne({
      role: "manager",
    });

    if (existingManager) {
      console.log("Manager already exists");
      process.exit();
    }

    const email = process.env.INITIAL_MANAGER_EMAIL?.trim().toLowerCase();
    const password = process.env.INITIAL_MANAGER_PASSWORD;

    if (!email || !password || password.length < 8) {
      throw new Error("Set INITIAL_MANAGER_EMAIL and INITIAL_MANAGER_PASSWORD (8+ characters) in .env before seeding.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await User.create({
      name: process.env.INITIAL_MANAGER_NAME?.trim() || "APMS Manager",
      email,
      password: hashedPassword,
      role: "manager",
    });

    console.log("Manager created successfully");
    console.log("Email:", manager.email);

    process.exit();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

createManager();
