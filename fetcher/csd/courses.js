const mongoose = require('mongoose');
const fetch = require('node-fetch');

const CourseModel = require('../../models/CourseModel');

const READ_SLEEP = 50;
const CURRENT_PROGRAM = '600000014';

const BASE_URL = 'https://ws-ext.it.auth.gr/open/';
const PROGRAM_COURSES = BASE_URL + 'getStudiesProgCourses/' + CURRENT_PROGRAM;
const COURSE_INFO = BASE_URL + 'getCourseInfo/';
const CLASS_INFO = BASE_URL + 'getClassInfo/';

async function fetchCourse(courses, index) {
  const course = courses[index];
  const id = course.courseId;
  const code = course.coursecode;
  fetch(COURSE_INFO + id)
    .then(res => res.json())
    .then(json => {
      const classID = json.course.classID;
      const title = json.course.title;
      const titleEN = json.course.titleEN;
      // const ects = json.course.ects;

      console.log(`[${code}] ${titleEN}`);
      fetch(CLASS_INFO + classID)
        .then(res => res.json())
        .then(json => {
          const clazz = json.class;
          const qa = clazz.qa_data;
          if (qa.message === 'The requested class could not be found.') {
            return;
          }
          const qa_gen = qa.general_data;
          const qa_form = qa.course_information_form_data;
          const prereq = qa_form.prerequisites;
          const assess = qa_form.student_assessment;
          const methods = [];
          for (var v in assess.assessment_methods) {
            methods.push(v);
          }

          new CourseModel({
            _id: id,
            basic_info: {
              title,
              code,
              period: clazz.periodID,
              teacher: qa_gen.course_info.teacher_in_charge,
              class: {
                year: qa_gen.class_info.academic_year,
                teachers: qa_gen.class_info.instructors.split(', ')
              }
            },
            extra_data: {
              erasmus: qa_form.erasums == 1,
              prerequisites: {
                courses: prereq.required_courses,
                knowledge: prereq.general_prerequisites.el
              },
              goal: qa_form.learning_outcomes.el,
              content: qa_form.course_content_syllabus.course_content.el,
              assessment: {
                description: assess.description_of_the_procedure.el,
                methods
              }
            }
          }).save();
        })
        .catch(err => {
          console.error(err);
          courses.push(course);
        });
    })
    .then(() =>
      setTimeout(() => {
        if (++index < courses.length) {
          fetchCourse(courses, index);
        } else {
          console.log('Done!');
          mongoose.disconnect();
        }
      }, READ_SLEEP)
    );
}

mongoose
  .connect('mongodb://127.0.0.1:27017/grade_plus_plus', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    fetch(PROGRAM_COURSES)
      .then(res => res.json())
      .then(async json => {
        const courses = json.courses;
        console.log(`Read ${courses.length} courses`);
        fetchCourse(courses, 0);
      });
  });

mongoose.set('useCreateIndex', true);
