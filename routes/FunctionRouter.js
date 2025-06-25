const express = require("express");
const { exec } = require("child_process");
const path = require("path");

const router = express.Router();

router.get("/runFile", (req, res) => {
  const scriptPath = `"${path.join(__dirname, "..", "app.py")}"`; 
  const command = `python ${scriptPath}`; 

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return res.status(500).json({ error: "Failed to run Python script." });
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }

    console.log(`stdout: ${stdout}`);
    res.json({
      message: "Python script executed successfully.",
      output: stdout.trim(),
    });
  });
});

module.exports = router;
