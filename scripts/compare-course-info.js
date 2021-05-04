const fetch = require("node-fetch");

const CURRENT_PROGRAM = "600000014";

const BASE_URL = "https://ws-ext.it.auth.gr/open/";
const PROGRAM_COURSES = BASE_URL + "getStudiesProgCourses/" + CURRENT_PROGRAM;
const COURSE_INFO = BASE_URL + "getCourseInfo/";
const COURSE_CLASSES = BASE_URL + "getCourseClasses/";

async function fetchCourse(courses, index) {
  const course = courses[index];
  const id = course.courseId;
  fetch(COURSE_INFO + id)
    .then((res) => res.json())
    .then((json) => {
      const classID = json.course.classID;
      console.log(classID);
      fetch(COURSE_CLASSES + id)
        .then((res) => res.json())
        .then((json) => {
          const clazz = json.class[0].classID;
          console.log(clazz);
          if (++index < courses.length) {
            fetchCourse(courses, index);
          } else {
            console.log("Done!");
          }
        });
    });
}

fetch(PROGRAM_COURSES)
  .then((res) => res.json())
  .then(async (json) => {
    const courses = json.courses;
    console.log(`Read ${courses.length} courses`);
    fetchCourse(courses, 0);
  });
