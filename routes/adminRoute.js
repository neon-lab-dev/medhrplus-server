const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getAllEmployers,
  getSingleEmployer,
  getAllEmployees,
  getSingleEmployee,
  adminProfile,
  deleteEmployee,
  deleteEmployer,
  counts,
  deletejob,
  contact
} = require("../controllers/adminController");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const router = express.Router();

//admin register api
router.route("/register/admin").post(registerAdmin);
//admin login api
router.route("/login/admin").post(loginAdmin);
//admin get profile api
router.route("/admin/me").get(isAuthenticatedAdmin, adminProfile);
//admin logout api
router.route("/logout/admin").get(logoutAdmin);
//admin get all employers api
router.route("/admin/allEmployers").get(isAuthenticatedAdmin, getAllEmployers);
//admin get single employer api
router
  .route("/admin/employer/:id")
  .get(isAuthenticatedAdmin, getSingleEmployer)
  .delete(isAuthenticatedAdmin, deleteEmployer);
//admin get all employees api
router.route("/admin/allEmployees").get(isAuthenticatedAdmin, getAllEmployees);


//admin get single employee api
router
  .route("/admin/employee/:id")
  .get(isAuthenticatedAdmin, getSingleEmployee)
  .delete(isAuthenticatedAdmin, deleteEmployee);

//admin delete job api
router.route("/admin/job/:id").delete(isAuthenticatedAdmin, deletejob);

router.route("/admin/counts").get(isAuthenticatedAdmin, counts);
router.route("/admin/contact").post(contact);

module.exports = router;
