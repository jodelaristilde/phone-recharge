const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");
const ADMIN_FILE = path.join(__dirname, "admin.json");

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
    console.log("Login attempt:", { username, password });
    
    const adminData = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
    console.log("Admin data from file:", adminData);
    
    if (username === adminData.username && password === adminData.password) {
      console.log("Login successful");
      res.json({ success: true });
    } else {
      console.log("Login failed: Invalid credentials");
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error verifying credentials:", error);
    res.status(500).json({ error: "Failed to verify credentials" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
