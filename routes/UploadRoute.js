const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const auth = require('../middleware/auth');
const UserData = require('../models/UserData');
const csv = require('csv-parser');

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
router.post("/upload_csv", auth, upload.single("csvfile"), async (req, res) => {
  console.log('UploadRoute: received upload for user', req.user.userId, 'file:', req.file?.path);
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
      exec(`python "${insightsScript}" --agg_csv "${aggOutput}" --event_log "${req.file.path}" --output_txt "${insightsOutput}"`, async (err3, stdout3, stderr3) => {
        if (err3) {
          return res.status(500).json({ error: "Insights generation failed", details: stderr3 });
        }
        try {
          // Parse recommendations CSV
          const recs = [];
          fs.createReadStream(recOutput)
            .pipe(csv())
            .on('data', (row) => recs.push(row))
            .on('error', err => {
              console.error('Error parsing recommendations CSV', err);
              return res.status(500).json({ error: 'Failed to parse recommendation CSV', details: err.message });
            })
            .on('end', async () => {
              // Generate analytics JSON files via app.py
              exec(`python "${path.join(__dirname, '..', 'app.py')}"`, (appErr, appStdout, appStderr) => {
                if (appErr) console.error('Error running app.py for JSON outputs', appStderr);
                // Now proceed to upsert including JSON analytics
                try {
                  const text = fs.readFileSync(insightsOutput, 'utf-8');
                  // Parse insights text into sections
                  const process = [];
                  const user = [];
                  const activity = [];
                  let section = null;
                  text.split(/\r?\n/).forEach(line => {
                    if (line.includes('--- Process-level Insights')) section = process;
                    else if (line.includes('--- User-level Insights')) section = user;
                    else if (line.includes('--- Activity-level Insights')) section = activity;
                    else if (line.trim() && section) section.push(line.trim());
                  });
                  // Read analytics JSON files
                  let commonPaths = [];
                  let stepDurations = [];
                  let caseDurations = {};
                  let slaViolations = [];
                  let userDelays = {};
                  let pathTree = [];
                  let casePaths = [];
                  try { commonPaths = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'common_paths.json'), 'utf-8')); } catch {}
                  try { stepDurations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'step_durations.json'), 'utf-8')); } catch {}
                  try { caseDurations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'case_durations.json'), 'utf-8')); } catch {}
                  try { slaViolations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'sla_violations.json'), 'utf-8')); } catch {}
                  try { userDelays = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'user_delays.json'), 'utf-8')); } catch {}
                  try { pathTree = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'path_tree.json'), 'utf-8'));  } catch {}
                  try { casePaths = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'case_paths.json'), 'utf-8')); } catch {}
                  // Build payload
                  const payload = {
                    recommendations: recs,
                    insights: { process, user, activity },
                    commonPaths,
                    stepDurations,
                    caseDurations,
                    slaViolations,
                    userDelays,
                    pathTree,
                    casePaths,
                    updatedAt: new Date()
                  };
                  console.log('UploadRoute: upserting with full payload', payload);
                  UserData.findOneAndUpdate({ user: req.user.userId }, payload, { upsert: true, new: true })
                    .then(result => {
                      res.json({ message: 'CSV uploaded and data saved', data: result });
                      // Cleanup uploaded CSV and latest.txt
                      try {
                        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                        const latestFile = path.join(__dirname, '..', 'uploads', 'latest.txt');
                        if (fs.existsSync(latestFile)) fs.unlinkSync(latestFile);
                      } catch (err) {
                        console.error('Cleanup error (uploads):', err);
                      }
                      // Cleanup output JSON and CSV files
                      try {
                        const outputDir = path.join(__dirname, '..', 'output');
                        const filesToDelete = [
                          'cleaned_log.csv',
                          'common_paths.json',
                          'step_durations.json',
                          'case_durations.json',
                          'sla_violations.json',
                          'user_delays.json',
                          'path_tree.json',
                          'case_paths.json'
                        ];
                        filesToDelete.forEach(filename => {
                          const filePath = path.join(outputDir, filename);
                          if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                          }
                        });
                      } catch (err) {
                        console.error('Cleanup error (output):', err);
                      }
                      // Cleanup ml_backend intermediate files
                      try {
                        const mlBackendDir = path.join(__dirname, '..', 'ml_backend');
                        ['aggregated_data.csv', 'heuristic_recommendations.csv', 'process_insights.txt'].forEach(fn => {
                          const fp = path.join(mlBackendDir, fn);
                          if (fs.existsSync(fp)) fs.unlinkSync(fp);
                        });
                      } catch (err) {
                        console.error('Cleanup error (ml_backend):', err);
                      }
                    })
                     .catch(dbErr => {
                       console.error('DB upsert error', dbErr);
                       res.status(500).json({ error: 'DB upsert failed', details: dbErr.message });
                     });
                } catch (e) {
                  console.error('UploadRoute processing error', e);
                  res.status(500).json({ error: 'Error processing upload', details: e.message });
                }
              });
            });
        } catch (e) {
          return res.status(500).json({ error: 'Failed to save user data', details: e.message });
        }
       });
    });
  });
});

// DELETE endpoint to clear user data and files
router.delete('/reset', auth, async (req, res) => {
  try {
    // Remove user data from DB
    await UserData.deleteOne({ user: req.user.userId });
    // Clear uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    fs.readdirSync(uploadsDir).forEach(file => {
      fs.unlinkSync(path.join(uploadsDir, file));
    });
    // Clear output analytics files
    try {
      const outputDir = path.join(__dirname, '..', 'output');
      const filesToDelete = [
        'cleaned_log.csv',
        'common_paths.json',
        'step_durations.json',
        'case_durations.json',
        'sla_violations.json',
        'user_delays.json',
        'path_tree.json',
        'case_paths.json'
      ];
      filesToDelete.forEach(filename => {
        const filePath = path.join(outputDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    } catch (err) {
      console.error('Cleanup error (output files) in reset:', err);
    }
     // Clear ml_backend output files
     const mlDir = path.join(__dirname, '..', 'ml_backend');
     ['aggregated_data.csv', 'heuristic_recommendations.csv', 'process_insights.txt'].forEach(filename => {
       const filePath = path.join(mlDir, filename);
       if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
     });
    res.json({ message: 'User data and files reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset user data', details: err.message });
  }
});

module.exports = router;
