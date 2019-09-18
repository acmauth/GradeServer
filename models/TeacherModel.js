const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeacherSchema = new Schema({

});

module.exports = mongoose.model('Teacher', TeacherSchema);