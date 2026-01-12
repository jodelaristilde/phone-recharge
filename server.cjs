require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");
const ADMIN_FILE = path.join(__dirname, "admin.json");
const USERS_FILE = path.join(__dirname, "users.json");
const HISTORY_FILE = path.join(__dirname, "history.json");

// API endpoint to get requests
app.get("/api/requests", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    res.json(data);
  } catch (error) {
    console.error("Error reading data:", error);
    res.status(500).json({ error: "Failed to read data" });
  }
});

// API endpoint to save requests
app.post("/api/requests", (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

// API endpoint to verify admin credentials
app.post("/api/admin/login", (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", { username });

    // First check admin.json (plain password for backward compatibility)
    const adminData = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));

    if (username === adminData.username && password === adminData.password) {
      console.log("Login successful (admin)");
      return res.json({ success: true });
    }

    // Then check users.json (hashed passwords)
    if (fs.existsSync(USERS_FILE)) {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
      const user = users.find(u => u.username === username);

      if (user && bcrypt.compareSync(password, user.password)) {
        console.log("Login successful (registered user)");
        return res.json({ success: true });
      }
    }

    console.log("Login failed: Invalid credentials");
    res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Error verifying credentials:", error);
    res.status(500).json({ error: "Failed to verify credentials" });
  }
});

// API endpoint to register new users
app.post("/api/admin/register", (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Get existing users
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    }

    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Add new user
    const newUser = {
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Save users
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    console.log("User registered successfully:", username);
    res.json({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// API endpoint to get all users
app.get("/api/admin/users", (req, res) => {
  try {
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    }

    // Return users without passwords
    const safeUsers = users.map(user => ({
      username: user.username,
      createdAt: user.createdAt
    }));

    res.json({ users: safeUsers });
  } catch (error) {
    console.error("Error loading users:", error);
    res.status(500).json({ error: "Failed to load users" });
  }
});

// API endpoint to delete a user
app.delete("/api/admin/users", (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    if (!fs.existsSync(USERS_FILE)) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get existing users
    let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

    // Filter out the user to delete
    const updatedUsers = users.filter(u => u.username !== username);

    if (users.length === updatedUsers.length) {
      return res.status(404).json({ error: "User not found" });
    }

    // Save updated users list
    fs.writeFileSync(USERS_FILE, JSON.stringify(updatedUsers, null, 2));

    console.log("User deleted successfully:", username);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// API endpoint to get history
app.get("/api/history", (req, res) => {
  try {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    }

    // Sort by date descending and limit to 7 days
    const last7Days = history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);

    res.json({ history: last7Days });
  } catch (error) {
    console.error("Error loading history:", error);
    res.status(500).json({ error: "Failed to load history" });
  }
});

// API endpoint for daily reset (cron job)
app.post("/api/cron/daily-reset", (req, res) => {
  try {
    // Verify cron secret
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log("Unauthorized daily reset attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("Running daily reset cron job...");

    // Get current data
    let currentData = { requests: [], date: "" };
    if (fs.existsSync(DATA_FILE)) {
      currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }

    if (currentData.requests && currentData.requests.length > 0) {
      // Calculate total sold for the day
      const totalSold = currentData.requests.reduce((sum, req) => sum + (req.amount || 0), 0);

      // Get existing history
      let history = [];
      if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
      }

      // Add today's data to history
      const historyEntry = {
        date: currentData.date || new Date().toLocaleDateString(),
        totalSold: totalSold,
        totalRequests: currentData.requests.length,
        timestamp: new Date().toISOString()
      };

      history.push(historyEntry);

      // Keep only last 30 days of history
      const last30Days = history
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);

      // Save updated history
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(last30Days, null, 2));

      console.log("History saved:", historyEntry);
    }

    // Reset current data
    const today = new Date().toLocaleDateString();
    const resetData = {
      requests: [],
      date: today
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(resetData, null, 2));

    console.log("Daily reset completed successfully");

    res.json({
      success: true,
      message: "Daily reset completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error during daily reset:", error);
    res.status(500).json({ error: "Failed to complete daily reset" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve test page
app.get("/test-reset.html", (req, res) => {
  res.sendFile(path.join(__dirname, "test-reset.html"));
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, "dist")));

// Handle SPA routing - serve index.html for all routes that aren't API calls
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  console.log("=".repeat(50));
});
