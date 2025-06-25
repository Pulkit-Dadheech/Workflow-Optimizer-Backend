// routes/ApiRoute.js
const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const UserData = require('../models/UserData');

// Protect all API routes
router.use(auth);

// Common paths
router.get("/common_paths", async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: "No data found" });
    res.json(data.commonPaths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step durations
router.get("/step_durations", async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: "No data found" });
    res.json(data.stepDurations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Case durations
router.get("/case_durations", async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: "No data found" });
    // Return only the array of cases
    const cd = data.caseDurations;
    res.json(Array.isArray(cd) ? cd : (cd.cases || []));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SLA violations
router.get("/sla_violations", async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: "No data found" });
    res.json(data.slaViolations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User delays
router.get("/user_delays", async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: "No data found" });
    // Return only the user_stats array
    const ud = data.userDelays;
    res.json(Array.isArray(ud) ? ud : (ud.user_stats || []));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;