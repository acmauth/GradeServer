const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  title: { type: String, require: true },
  code: String,
  period: String,
  teacher: String
});

const ClassSchema = new Schema({
  year: String,
  teachers: [String]
});

const BasicInfoSchema = new Schema({
  course: CourseSchema,
  class: ClassSchema
});

const PrerequisitesSchema = new Schema({
  courses: [String],
  knowledge: [String]
});

const AssessmentSchema = new Schema({
  description: String,
  methods: [String]
});

const ExtraDataSchema = new Schema({
  erasmus: Boolean,
  prerequisites: PrerequisitesSchema,
  goal: String,
  content: [String],
  assessment: AssessmentSchema
});

const CourseInfoSchema = new Schema({
  basic_info: BasicInfoSchema,
  extra_data: ExtraDataSchema
});

module.exports = mongoose.model('CourseInfo', CourseInfoSchema);