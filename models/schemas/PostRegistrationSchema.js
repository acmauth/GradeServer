const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  reason: [String],
  study_time: Number,
  lectures: String,
  private: Boolean,
  postgraduate: String,
  roomates: String,
  distance: String,
  hobbies: [String]
}, { _id: false });
