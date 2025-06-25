// routes/ApiRoute.js
const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/common_paths", (req, res) => {
  const common_paths = path.join(__dirname, "..", "output", "common_paths.json")

  res.sendFile(common_paths, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Failed to send file.");
    }
  });
});
router.get("/step_durations", (req, res) => {
  const step_durations = path.join(__dirname, "..", "output", "step_durations.json")

  res.sendFile(step_durations, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Failed to send file.");
    }
  });
});
router.get("/user_delays", (req, res) => {
  const user_delays = path.join(__dirname, "..", "output", "user_delays.json")

  res.sendFile(user_delays, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Failed to send file.");
    }
  });
});
router.get("/sla_violations", (req, res) => {
  const sla_violations = path.join(__dirname, "..", "output", "sla_violations.json")

  res.sendFile(sla_violations, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Failed to send file.");
    }
  });
});
router.get("/case_durations", (req, res) => {
  const case_durations = path.join(__dirname, "..", "output", "case_durations.json")

  res.sendFile(case_durations, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Failed to send file.");
    }
  });
});
// router.get("/:function", (req, res) => {
//   const fileName = `${req.params.function}.json`
//   const filePath = path.join(__dirname, "..", "output", fileName)

//   res.sendFile(filePath, (err) => {
//     if (err) {
//       console.error("Error sending file:", err);
//       res.status(500).send("Failed to send file.");
//     }
//   });
// });



module.exports = router;