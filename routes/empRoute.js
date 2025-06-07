const express = require("express");
const {
  registerUser,
  verify,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  EnterUserDetails,
  getUserDetails,
  updateUserDetails,
  updatePassword,
  uploadUserResume,
} = require("../controllers/employeeController");

const { isAuthenticatedUser } = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const { sendHiredEmail } = require("../controllers/employeerController");

const router = express.Router();

//register
router.route("/register").post(registerUser);

router.route("/verify").post(verify);

//login
router.route("/login").post(loginUser);

//forgot password
router.route("/password/forgot").post(forgotPassword);

router.post("/send-hired-email/:userId", sendHiredEmail);

//reset password
router.route("/password/reset/:token").put(resetPassword);

//logout
router.route("/logout").get(logout);

//update user professional details
router.route("/user/details").put(isAuthenticatedUser, EnterUserDetails);

//get my profile
router.route("/me").get(isAuthenticatedUser, getUserDetails);

//update user details
router
  .route("/me/update")
  .put(isAuthenticatedUser, singleUpload, updateUserDetails);


//change password
router.route("/password/update").put(isAuthenticatedUser, updatePassword); 

router
  .route("/resumes")
  .put(isAuthenticatedUser, singleUpload, uploadUserResume);

module.exports = router;
