const express = require('express');
const router = express.Router();

const CourseController = require('../controllers/CourseController');
const checkAuth = require('../middleware/check-auth');

/* Course Information */
router.get('/check_version/:version_id', checkAuth, CourseController.check_version);

router.get('/info/:course_id', checkAuth, CourseController.info);

router.get('/predict', checkAuth, CourseController.predict);

router.get('/suggest', checkAuth, CourseController.suggest);

module.exports = router;
