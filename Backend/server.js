const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");


const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const announcementRoutes = require("./routes/announcementRoutes");


dotenv.config();

connectDB();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin is not allowed"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "100kb" }));

const loginAttempts = new Map();
app.use("/api/auth/login", (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, startedAt: now };
  if (now - entry.startedAt > 15 * 60 * 1000) {
    entry.count = 0;
    entry.startedAt = now;
  }
  entry.count += 1;
  loginAttempts.set(key, entry);
  if (entry.count > 20) {
    return res.status(429).json({ message: "Too many login attempts. Please try again later." });
  }
  return next();
});

app.get("/", (req, res) => {
  res.send("APMS Backend API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);

app.use((err, req, res, next) => {
  if (err?.name === "CastError") return res.status(400).json({ message: "Invalid resource ID." });
  if (err?.type === "entity.too.large") return res.status(413).json({ message: "Request body is too large." });
  if (err?.message === "CORS origin is not allowed") return res.status(403).json({ message: "Origin is not allowed." });
  console.error("Unhandled server error:", err);
  return res.status(500).json({ message: "Server error." });
});
app.use(
  "/api/activities",
  activityRoutes
);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use(
  "/api/announcements",
  announcementRoutes
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
