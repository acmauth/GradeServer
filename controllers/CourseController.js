const CourseModel = require('../models/CourseModel');

module.exports = {
  info: (req, res) => {
    CourseModel.findOne({ 'basic_info.code': req.params.course_id })
      .exec()
      .then(course => {
        course.__v = undefined;
        res.json(course);
      })
      .catch();
  },

  list: (req, res) => {
    CourseModel.find()
      .exec()
      .then(courses => {
        courses.forEach(course => {
          course.__v = undefined;
        });
        res.json(courses);
      })
      .catch();
  },

  predict: (req, res) => {
    res.json({});
  },

  suggest: (req, res) => {
    res.json({});
  }
};
