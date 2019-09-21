const express = require('express');
const router = express.Router();

const UserController = require('../controllers/UserController');
const checkAuth = require('../middleware/check-auth');
const deleteUser = require('../middleware/delete-user');

/* User profile */

router.get('/download_data', checkAuth, UserController.getData);

router.get('/profile', checkAuth, UserController.getProfile);

router.patch('/profile', checkAuth, UserController.updateBio);

router.put('/grades', checkAuth, UserController.updateGrades);

router.delete('/request_deletion', checkAuth, deleteUser);

/* Favorites */

router.patch('/favorites/course', checkAuth, UserController.addFavoriteCourse);

router.delete(
  '/favorites/course',
  checkAuth,
  UserController.removeFavoriteCourse
);

router.patch(
  '/favorites/teacher',
  checkAuth,
  UserController.addFavoriteTeacher
);

router.delete(
  '/favorites/teacher',
  checkAuth,
  UserController.removeFavoriteTeacher
);

module.exports = router;
