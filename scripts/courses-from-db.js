const fetch = require("node-fetch");
const fs = require("fs");

const CURRENT_PROGRAM = "600000014";

const BASE_URL = "https://ws-ext.it.auth.gr/open/";
const PROGRAM_COURSES = BASE_URL + "getStudiesProgCourses/" + CURRENT_PROGRAM;
courses = [];

fetch(PROGRAM_COURSES)
  .then((res) => res.json())
  .then(async (json) => {
    const courses = json.courses;
    console.log(`Read ${courses.length} courses`);
    for (course in courses) {
      const id = course.courseId;
      const code = course.coursecode;

      courses.push({
        courseID: id,
        coursecode: code,
      });
    }

    const data = JSON.stringify({
      courses: courses,
    });

    fs.writeFile("courses.json", data, (err) => {
      if (err) {
        throw err;
      }
    });
  });
