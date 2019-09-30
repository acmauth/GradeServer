const mongoose = require('mongoose');
const fetch = require('node-fetch');

const TeacherModel = require('../../models/TeacherModel');

const READ_SLEEP = 50;
const DEPARTMENT = 'CSD';

const BASE_URL = 'https://ws-ext.it.auth.gr/open/';
const TEACHERS = BASE_URL + 'getDeptDEP/' + DEPARTMENT;
const TEACHER_CLASSES = BASE_URL + 'getClassesTaughtByDEP/';
const TEACHER_INFO = BASE_URL + 'getPersonInfo/';

function saveTeacher(name, teacher_id, courses) {
  console.log(`[${teacher_id}] ${name}`);
  new TeacherModel({
    _id: teacher_id,
    name,
    courses
  }).save();
}

async function fetchTeacher(teachers, index) {
  const teacher = teachers[index];
  const id = teacher.apmId;
  let name = null;

  fetch(TEACHER_CLASSES + id)
    .then(res => res.json())
    .then(json => {
      let courses = json.classes.map(clazz => clazz.courseID);

      json.classes.forEach(clazz => {
        if (clazz.instructors.split(',').length == 1) {
          name = clazz.instructors;
          return;
        }
      });

      if (name != null) {
        saveTeacher(name, id, courses);
      } else {
        fetch(TEACHER_INFO + id)
          .then(res => res.json())
          .then(json => saveTeacher(`${json.first} ${json.last}`, id, courses));
      }
    })
    .catch(err => {
      console.error(err);
      teachers.push(teacher);
    })
    .then(() =>
      setTimeout(() => {
        if (++index < teachers.length) {
          fetchTeacher(teachers, index);
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
    fetch(TEACHERS)
      .then(res => res.json())
      .then(json => {
        const teachers = json.dep;
        console.log(`Read ${teachers.length} teachers`);
        fetchTeacher(teachers, 0);
      });
  });

mongoose.set('useCreateIndex', true);
