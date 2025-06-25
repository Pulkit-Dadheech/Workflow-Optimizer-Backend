// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const connectDB = require('./models/connectDB');
const authRoutes = require('./routes/auth/auth');

// Enable CORS for all routes and allow Authorization header and credentials
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Parse cookies for auth middleware
app.use(cookieParser());
app.use(express.json());

const FunctionRouter = require('./routes/FunctionRouter');
const ApiRoute = require("./routes/ApiRoute");
const UploadRoute = require("./routes/UploadRoute");
const RecommendationRoute = require("./routes/RecommendationRoute");
app.use('/run', FunctionRouter);
app.use("/api",ApiRoute);
app.use("/upload", UploadRoute);
app.use("/recommendation", RecommendationRoute);
app.use('/auth', authRoutes);
app.get("/",(req,res)=>{
  res.send("server is live")
});

connectDB();
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
