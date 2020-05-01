const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController");
const checkAuth = require("../middleware/check-auth");
const deleteUser = require("../middleware/delete-user");

/* User profile */

router.get("/download_data", checkAuth, UserController.getData);

router.get("/profile", checkAuth, UserController.getProfile);

router.patch("/profile", checkAuth, UserController.updateBio);

router.patch("/change_password", checkAuth, UserController.changePassword);

router.patch("/grades/list", checkAuth, UserController.updateGradesList);

router.put("/grades/pdf", checkAuth, UserController.updateGradesPDF);

router.delete("/request_deletion", checkAuth, deleteUser);

/* Favorites */

router.post("/favorites", checkAuth, UserController.updateFavorites);

module.exports = router;
