const express = require("express");
const { isAuthenticatedAdmin, isAuthenticatedEmployeer, isAuthenticatedAdminOrEmployer, isAuthenticatedUser } = require("../middleware/auth");
const {
    createCourse,
    deleteCourse,
    getAllCourses,
    getCourseDetails,
    updateCourse,
    getAllEmployerCourses,
    applyOnCourse,
} = require("../controllers/courseController.js");
const handleMultiMediaUpload = require("../middleware/mediaUpload.js");
const router = express.Router();
router.route("/courses/create").post(isAuthenticatedAdminOrEmployer, handleMultiMediaUpload, createCourse);
router.route("/courses/apply/:id").post(isAuthenticatedUser, applyOnCourse);
router
  .route("/employeer/course")
  .get(isAuthenticatedEmployeer, getAllEmployerCourses);
router.route("/courses").get(getAllCourses);
router.route("/courses/:id")
    .get(getCourseDetails)
    .delete(isAuthenticatedAdminOrEmployer, deleteCourse)
    .put(isAuthenticatedAdminOrEmployer, handleMultiMediaUpload, updateCourse);

module.exports = router;
