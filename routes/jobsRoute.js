const express = require("express");
const {
  isAuthenticatedUser,
  isAuthenticatedEmployeer,
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

router.route("/createjob").post(isAuthenticatedEmployeer, createJob);

router.route("/jobs").get(getAllJob);

router
  .route("/job/:id")
  .get(getSingleJob)
  .delete(isAuthenticatedEmployeer, deletejob)
  .put(isAuthenticatedEmployeer, updateJob);

router
  .route("/employeer/job")
  .get(isAuthenticatedEmployeer, getAllEmployeerJob);

router.route("/emp/:id").get(isAuthenticatedEmployeer, getSingleEmployee);

router.route("/apply/job/:id").put(isAuthenticatedUser, ApplyJob);

router.route("/employee/job").get(isAuthenticatedUser, getAllEmployeeJob);

router.route("/withdraw/job/:id").put(isAuthenticatedUser, withdrawApplication);
// router.route("/jobs/search").get(searchJob);
router.route("/jobs/application").put(isAuthenticatedEmployeer, jobIsViewed);
router.route("/jobs/manage").put(isAuthenticatedEmployeer, manageAppliedJobs);
module.exports = router;
