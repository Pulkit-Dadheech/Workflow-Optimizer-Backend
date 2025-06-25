const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Upload CSV endpoint
router.post("/upload_csv", upload.single("csvfile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Save the latest uploaded filename for analysis
  const latestPath = path.join(__dirname, "..", "uploads", "latest.txt");
  fs.writeFileSync(latestPath, req.file.path, "utf-8");

  // Run aggregation and recommendation pipeline
  const aggScript = path.join(__dirname, "..", "ml_backend", "aggregate_event_log.py");
  const recScript = path.join(__dirname, "..", "ml_backend", "heuristic_recommend.py");
  const insightsScript = path.join(__dirname, "..", "ml_backend", "process_insights.py");
  const aggOutput = path.join(__dirname, "..", "ml_backend", "aggregated_data.csv");
  const recOutput = path.join(__dirname, "..", "ml_backend", "heuristic_recommendations.csv");
  const insightsOutput = path.join(__dirname, "..", "ml_backend", "process_insights.txt");

  // Run aggregation first, then recommendation, then insights
  exec(`python "${aggScript}" --csv_path "${req.file.path}" --output_path "${aggOutput}"`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: "Aggregation failed", details: stderr });
    }
    exec(`python "${recScript}" --agg_csv "${aggOutput}" --output_csv "${recOutput}"`, (err2, stdout2, stderr2) => {
      if (err2) {
        return res.status(500).json({ error: "Recommendation failed", details: stderr2 });
      }
      // FIX: Add event_log argument for process_insights.py
      exec(`python "${insightsScript}" --agg_csv "${aggOutput}" --event_log "${req.file.path}" --output_txt "${insightsOutput}"`, (err3, stdout3, stderr3) => {
        if (err3) {
          return res.status(500).json({ error: "Insights generation failed", details: stderr3 });
        }
        res.json({
          message: "CSV file uploaded, recommendations and insights generated!",
          filename: req.file.filename,
          path: req.file.path,
        });
      });
    });
  });
});

module.exports = router;
