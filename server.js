const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const app = express();

// Database
mongoose.connect('mongodb://127.0.0.1:27017/grade_plus_plus', { useNewUrlParser: true })
.then (() => console.log("Connected to database..."))
.catch(err => console.error(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// Controllers
const UserController = require('./controllers/UserController');
const CourseController = require('./controllers/CourseController');
const TeacherController = require('./controllers/TeacherController');

// Routes
/* Authentication */
app.post('/auth/login', UserController.login);
app.post('/auth/signup', UserController.signup);

/* Course information */
app.get('/course/info/:course_id', CourseController.info);
app.get('/course/predict/:course_id', CourseController.predict);
app.get('/course/suggest', CourseController.suggest);

/* Data lists */
app.get('/list/courses', CourseController.list);
app.get('/list/teachers', TeacherController.list);

/* User profile */
app.get('/user/download_data', UserController.getData);
app.get('/user/profile', UserController.profile);
app.put('/user/grades', UserController.updateGrades);
app.delete('/user/data', UserController.removeData);

/* Favorites */
app.patch('/user/favorites/course', UserController.addFavoriteCourse);
app.delete('/user/favorites/course', UserController.removeFavoriteCourse);
app.patch('/user/favorites/teacher', UserController.addFavoriteTeacher);
app.delete('/user/favorites/teacher', UserController.removeFavoriteTeacher);

// Start server
app.listen(3000, () => console.log("Server has started on port 3000..."));