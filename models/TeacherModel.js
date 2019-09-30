const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeacherSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  courses: [String]
});

module.exports = mongoose.model('Teacher', TeacherSchema);
