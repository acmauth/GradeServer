const mongoose = require('mongoose');
const fetch = require('node-fetch');

const CourseModel = require('../../models/CourseModel');

const READ_SLEEP = 50;
const CSD_UNDERGRADUATE = '600000014';

const BASE_URL = 'https://ws-ext.it.auth.gr/open/';
const PROGRAM_COURSES = BASE_URL + 'getStudiesProgCourses/' + CSD_UNDERGRADUATE;
const COURSE_INFO = BASE_URL + 'getCourseInfo/';
const CLASS_INFO = BASE_URL + 'getClassInfo/';

async function fetchCourses(courses) {
  while (courses.length > 0) {
    // `courses` is like a queue. We remove
    // the first element each time to avoid
    // an excessive growth of memory used.
    const course = courses.shift();
    const id = course.courseId;
    const code = course.coursecode;
    const courseInfo = await fetch(COURSE_INFO + id).then(res => res.json());
    const classID = courseInfo.course.classID;
    const name = courseInfo.course.title;
    const titleEN = courseInfo.course.titleEN;
    // const ects = json.course.ects;

    console.log(`[${code}] ${titleEN}`);
    try {
      const classInfo = await fetch(CLASS_INFO + classID).then(res => res.json());
      const clazz = classInfo.class;
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

      await new CourseModel({
        _id: id,
        basic_info: {
          name,
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
    } catch (err) {
      console.error(err);
      // If a request fails, we will retry it at the end.
      courses.push(course);
    }

    // We don't want to overburden the server,
    // so we will pause for a while.
    await new Promise(r => setTimeout(r, READ_SLEEP));
  }
  console.log('Fetching courses done!');
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
        return fetchCourses(courses)
          // Better to disconnect in the
          // same place as where we connected.
          .then(() => mongoose.disconnect());
      });
  });

mongoose.set('useCreateIndex', true);
