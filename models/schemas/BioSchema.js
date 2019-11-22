const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  _id: false,
  name: String,
  school: String,
  semester: Number,
  reason: [String],
  study_time: Number,
  lectures: String,
  privateLessons: Boolean,
  postgraduate: String,
  roomates: String,
  distance: String,
  hobbies: [String]
});
