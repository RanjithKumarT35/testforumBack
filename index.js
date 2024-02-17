const express = require("express");
const connectToDatabase = require("./database");
const threadRouter = require("./routers/threadRoute");
const notificationRouter = require("./routers/notificationRouter");
const userRouter = require("./routers/userrouter");
const forumRouter = require("./routers/forumRoute");
const headingRouter = require("./routers/headingRoutes");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const imgur = require("imgur");
const fs = require("fs");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const helmet = require("helmet");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const uploadDir = __dirname + "/uploads";

// Middleware
app.use(helmet()); // Add security headers
app.use(fileUpload());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(cors({ origin: "https://testforumrevnitro.netlify.app", credentials: true }));
app.use("/uploads", express.static("uploads"));

// Connect to database
connectToDatabase();

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Routes
app.post("/upload", (req, res) => {
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }
  let sampleFile = req.files.sampleFile;
  let uploadPath = __dirname + "/uploads/" + sampleFile.name;
  fs.writeFileSync(uploadPath, sampleFile.data);
  imgur.uploadFile(uploadPath).then((urlObject) => {
    fs.unlinkSync(uploadPath);
    return res.status(200).json({ link: urlObject.data.link });
  });
});

app.use("/auth", userRouter);
app.use("/threads", threadRouter);
app.use("/notifications", notificationRouter);
app.use("/forum", forumRouter);
app.use("/heading", headingRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});
