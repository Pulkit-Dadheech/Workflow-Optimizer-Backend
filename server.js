const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());

const FunctionRouter = require('./routes/FunctionRouter');
const ApiRoute = require("./routes/ApiRoute");
const UploadRoute = require("./routes/UploadRoute");
const RecommendationRoute = require("./routes/RecommendationRoute");
app.use('/run', FunctionRouter);
app.use("/api",ApiRoute);
app.use("/upload", UploadRoute);
app.use("/recommendation", RecommendationRoute);
app.get("/",(req,res)=>{
  res.send("server is live")
});
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
