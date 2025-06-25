const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const csv = require("csv-parser");
const auth = require('../middleware/auth');
const UserData = require('../models/UserData');

// Route to fetch user data
router.get('/userdata', auth, async (req, res) => {
  try {
    console.log('RecommendationRoute: fetching userdata for', req.user.userId);
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    console.log('RecommendationRoute: data found:', data);
    if (!data) return res.status(404).json({ error: 'No data found for user' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch only recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: 'No recommendations found for user' });
    res.json(data.recommendations || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch only insights
router.get('/insights', auth, async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: 'No insights found for user' });
    res.json(data.insights || { process: [], user: [], activity: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch process path tree
router.get('/path-tree', auth, async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: 'No path tree found for user' });
    res.json(data.pathTree || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch individual ticket paths
router.get('/case-paths', auth, async (req, res) => {
  try {
    const data = await UserData.findOne({ user: req.user.userId }).lean();
    if (!data) return res.status(404).json({ error: 'No case paths found for user' });
    res.json(data.casePaths || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
