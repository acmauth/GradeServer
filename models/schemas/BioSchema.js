const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  _id: false,
  name: String,
  school: String,
  semester: Number
});
