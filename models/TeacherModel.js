const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeacherSchema = new Schema({
    name: { type: String, required: true },
    teacher_id: String,
    courses: [String],
});

module.exports = mongoose.model('Teacher', TeacherSchema);