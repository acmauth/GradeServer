const mongoose = require('mongoose');
const fetch = require('node-fetch');

const TeacherModel = require('../../models/TeacherModel');

const READ_SLEEP = 50;
const DEPARTMENT = 'CSD';

const BASE_URL = 'https://ws-ext.it.auth.gr/open/';
const TEACHERS = BASE_URL + 'getDeptDEP/' + DEPARTMENT;
const TEACHER_CLASSES = BASE_URL + 'getClassesTaughtByDEP/';
const TEACHER_INFO = BASE_URL + 'getPersonInfo/';

async function saveTeacher(name, teacher_id, courses) {
  console.log(`[${teacher_id}] ${name}`);
  await new TeacherModel({
    _id: teacher_id,
    name,
    courses
  }).save();
}

async function fetchTeachers(teachers) {
  while (teachers.length > 0) {
    const teacher = teachers.shift();
    const id = teacher.apmId;
    let name = null;

    try {
        const json = await fetch(TEACHER_CLASSES + id).then(res => res.json())
        const courses = json.classes.map(clazz => clazz.courseID);

        json.classes.forEach(clazz => {
          if (clazz.instructors.split(',').length == 1)
            name = clazz.instructors;
        });

        if (name != null) {
          await saveTeacher(name, id, courses);
        } else {
          await fetch(TEACHER_INFO + id)
          .then(res => res.json())
          .then(json => saveTeacher(`${json.first} ${json.last}`, id, courses));
        }
    } catch (err) {
      console.error(err);
      teachers.push(teacher);
    }

    await new Promise(r => setTimeout(r, READ_SLEEP));
  }

  console.log('Fetching teachers done!');
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
        return fetchTeachers(teachers)
          .then(() => mongoose.disconnect());
      });
  });

mongoose.set('useCreateIndex', true);
