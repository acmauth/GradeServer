const express = require("express");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const path = require("path");
const cors = require("cors");
const app = express();

app.set("trust proxy", "127.0.0.1");

const userRoutes = require("./routes/user");
const courseRoutes = require("./routes/course");
const listRoutes = require("./routes/list");
const authRoutes = require("./routes/auth");

var accessLogStream = rfs.createStream("access.log", {
  interval: "1d",
  path: path.join(__dirname, "log"),
});
dotenv.config();

// Database
var dbURL = process.env.db;
if (!dbURL) {
  var user = process.env.mongoUser;
  var password = process.env.mongoPassword;
  var host = process.env.mongoHost;
  var db = process.env.mongoDatabase;

  dbURL = `mongodb://${user}:${password}@${host}/${db}?authSource=admin`;
}

mongoose
  .connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to database..."))
  .catch((err) => console.error(err));

mongoose.set("useCreateIndex", true);

var allowedOrigins = ["http://localhost", "http:127.0.0.1", "http://0.0.0.0"];

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      origin = origin.substring(0, origin.lastIndexOf(":"));
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy of this site does not allow access from the specified origin.";

        return callback(new Error(msg), false);
      }

      return callback(null, true);
    },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  fileUpload({
    preserveExtension: true,
    // safeFileNames: true
  })
);

app.use(morgan("combined", { stream: accessLogStream }));

// Routes

app.use("/user", userRoutes);
app.use("/course", courseRoutes);
app.use("/list", listRoutes);
app.use("/auth", authRoutes);

/* Can't find the requested resourse */
app.use((req, res, next) => {
  const error = new Error("Resource not found");
  error.status = 404;
  next(error);
});

/* Any other error */
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

// Start server
app.listen(3000, () => console.log("Server has started on port 3000..."));
