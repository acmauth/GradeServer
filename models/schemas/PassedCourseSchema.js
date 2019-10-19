const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  _id: String,
  semester: Number,
  year_passed: String,
  grade: Number
});
