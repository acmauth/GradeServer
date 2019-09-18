const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = require('./CourseSchema');

module.exports = new Schema({
  _id: false,
  courses: [CourseSchema]
});
