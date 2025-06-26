const express = require("express");
const {
  isAuthenticatedUser,
  isAuthenticatedEmployeer,
  isAuthenticatedAdminOrEmployer,
} = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const {
  createJob,
  getAllJob,
  getSingleJob,
  deletejob,
  updateJob,
  getAllEmployeerJob,
  ApplyJob,
  getAllEmployeeJob,
  withdrawApplication,
  getSingleEmployee,
  manageAppliedJobs,
  jobIsViewed,
} = require("../controllers/jobsController");

const router = express.Router();

router.route("/createjob").post(isAuthenticatedAdminOrEmployer, createJob);

router.route("/jobs").get(getAllJob);

router
  .route("/job/:id")
  .get(getSingleJob)
  .delete(isAuthenticatedAdminOrEmployer, deletejob)
  .put(isAuthenticatedAdminOrEmployer, updateJob);

router
  .route("/employeer/job")
  .get(isAuthenticatedAdminOrEmployer, getAllEmployeerJob);

router.route("/emp/:id").get(isAuthenticatedAdminOrEmployer, getSingleEmployee);

router.route("/apply/job/:id").put(isAuthenticatedUser, ApplyJob);

router.route("/employee/job").get(isAuthenticatedUser, getAllEmployeeJob);

router.route("/withdraw/job/:id").put(isAuthenticatedUser, withdrawApplication);
// router.route("/jobs/search").get(searchJob);
router.route("/jobs/application").put(isAuthenticatedAdminOrEmployer, jobIsViewed);
router.route("/jobs/manage").put(isAuthenticatedAdminOrEmployer, manageAppliedJobs);
module.exports = router;
