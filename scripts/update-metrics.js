const mongoose = require("mongoose");
const fs = require("fs");

const Course = require("../models/CourseModel");

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
  .then(() => {
    let rawdata = fs.readFileSync("course_metrics.json");
    let metrics = JSON.parse(rawdata);
    for (var courseCode in metrics) {
      Course.findByIdAndUpdate(courseCode, {
        $set: {
          "metrics.average": metrics[courseCode].average,
          "metrics.difficulty": metrics[courseCode].difficulty,
          "metrics.enrolled": metrics[courseCode].enrolled,
          "metrics.histogram": metrics[courseCode].histogram,
        },
      }).exec();
    }
  })
  .catch((err) => {
    console.error(err);
  });

mongoose.set("useFindAndModify", false);
