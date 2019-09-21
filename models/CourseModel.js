const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseInfoSchema = new Schema({
  basic_info: {
    title: { type: String, required: true },
    code: String,
    period: String,
    teacher: String,
    year: String,
    teachers: [String]
  },
  extra_data: {
    erasmus: Boolean,
    prerequisites: {
      courses: [String],
      knowledge: [String]
    },
    goal: String,
    content: [String],
    assessment: {
      description: String,
      methods: [String]
    }
  }
});

module.exports = mongoose.model('Course', CourseInfoSchema);
