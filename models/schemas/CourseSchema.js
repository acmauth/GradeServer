const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  name: { type: String, required: true },
  teacher: String,
  year_passed: Number,
  grade: Number,
  distribution: [Number]
});
