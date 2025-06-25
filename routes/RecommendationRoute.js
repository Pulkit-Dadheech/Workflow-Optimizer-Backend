const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const csv = require("csv-parser");

// Route to fetch recommendations
router.get("/recommendations", (req, res) => {
  const recPath = path.join(__dirname, "..", "ml_backend", "heuristic_recommendations.csv");
  if (!fs.existsSync(recPath)) {
    return res.status(404).json({ error: "Recommendations not found" });
  }
  const results = [];
  fs.createReadStream(recPath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      res.json(results);
    });
});

// Route to fetch process/user/activity insights
router.get("/insights", (req, res) => {
  const insightsPath = path.join(__dirname, "..", "ml_backend", "process_insights.txt");
  if (!fs.existsSync(insightsPath)) {
    return res.status(404).json({ error: "Insights not found" });
  }
  const data = fs.readFileSync(insightsPath, "utf-8");
  // Split into sections
  const process = [];
  const user = [];
  const activity = [];
  let section = null;
  data.split(/\r?\n/).forEach((line) => {
    if (line.includes("Process-level Insights")) section = process;
    else if (line.includes("User-level Insights")) section = user;
    else if (line.includes("Activity-level Insights")) section = activity;
    else if (line.trim() && section) section.push(line.trim());
  });
  res.json({ process, user, activity });
});

module.exports = router;
