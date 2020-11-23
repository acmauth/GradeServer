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
      .catch((err) => {
        console.error(`Error during teacher find():\n${err}`);
        return res.status(500).send();
      });
  }
};
