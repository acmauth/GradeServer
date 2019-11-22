const CourseModel = require('../models/CourseModel');
const UserModel = require('../models/UserModel');
const request = require('request');

module.exports = {
  info: (req, res) => {
    CourseModel.findOne({ 'basic_info.code': req.params.course_id })
      .exec()
      .then(course => {
        if (!course) {
          res.status(404).send();
          return;
        }
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
    UserModel.findOne({ _id: req.userData.userId })
      .exec()
      .then(user => {
        request.post(process.env.flask,
          {
            json: {
              id: user._id,
              courses: req.body.courses
            }
          },
          (error, response) => {
            if (error) {
              res.status(400).send();
              return;
            }
            res.json(response);
          }
        );
      })
      .catch();
  },

  suggest: (req, res) => {
    res.json({});
  }
};
