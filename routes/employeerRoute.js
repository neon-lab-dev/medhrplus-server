const express = require("express");
const { isAuthenticatedEmployeer, isAuthenticatedAdminOrEmployer } = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const {
  registerEmployeer,
  verify,
  loginEmployeer,
  forgotPassword,
  resetPassword,
  logout,
  EnterEmployeerDetails,
  getEmployerDetails,
  updateEmployeerDetails,
  findCandidates,
  sendContactEmail,
} = require("../controllers/employeerController");
const { updatePassword } = require("../controllers/employeeController");
const { getSingleEmployee } = require("../controllers/jobsController");
const router = express.Router();

//register
router.route("/register/employeer").post(registerEmployeer);

router.route("/verify/employeer").post(verify);

//login
router.route("/login/employeer").post(loginEmployeer);

//forgot password
router.route("/password/forgot/employeer").post(forgotPassword);

router.post("/send-contact-email/:userId", isAuthenticatedEmployeer, sendContactEmail);

//reset password
router.route("/password/employeer/reset/:token").put(resetPassword);

//logout
router.route("/employeer/logout").get(logout);

//update employeer professional details
router
  .route("/employeer/details")
  .put(isAuthenticatedEmployeer, EnterEmployeerDetails);

//get emp profile
router.route("/employeer/me").get(isAuthenticatedEmployeer, getEmployerDetails);

router.route("/employeer/find-candidates").get(isAuthenticatedEmployeer, findCandidates);

router
  .route("/employeer/me/update")
  .put(isAuthenticatedEmployeer, singleUpload, updateEmployeerDetails);


//change password
router.route("/employeer/password/update").put(isAuthenticatedEmployeer, updatePassword);
router
  .route("/employeer/employee/:id")
  .get(isAuthenticatedAdminOrEmployer, getSingleEmployee)


module.exports = router;
