const express = require('express');
const router = express.Router();

const TeacherController = require('../controllers/TeacherController');
const CourseController = require('../controllers/CourseController');
const checkAuth = require('../middleware/check-auth');

/* Data Lists */

router.get('/courses', checkAuth, CourseController.list);

router.get('/teachers', checkAuth, TeacherController.list);

module.exports = router;
