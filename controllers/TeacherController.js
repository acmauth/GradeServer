const TeacherModel = require('../models/TeacherModel');

module.exports = {
  list: (req, res) => {
    TeacherModel.find()
      .exec()
      .then(teachers => {
        teachers.forEach(teacher => {
            teacher.__v = undefined;
        })
        res.json(teachers);
      })
      .catch();
  }
};
