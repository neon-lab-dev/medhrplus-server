const express = require("express");
const { isAuthenticatedAdmin, isAuthenticatedAdminOrEmployer, isAuthenticatedEmployeer, isAuthenticatedUser } = require("../middleware/auth");
const { createSkills, deleteSkill, getAllSkills, getSkillDetails, updateSkill, getAllEmployerSkillProgrammes, applyOnSkillProgram } = require("../controllers/skillsController.js");
const handleMultiMediaUpload = require("../middleware/mediaUpload.js");
const router = express.Router();

router.route("/skills/create").post(isAuthenticatedAdminOrEmployer, handleMultiMediaUpload, createSkills);
router.route("/skills/apply/:id").post(isAuthenticatedUser, applyOnSkillProgram);
router.route("/skills").get(getAllSkills);
router
  .route("/employeer/skill-programmes")
  .get(isAuthenticatedEmployeer, getAllEmployerSkillProgrammes);
router.route("/skills/:id")
    .get(getSkillDetails)
    .delete(isAuthenticatedAdminOrEmployer, deleteSkill)
    .put(isAuthenticatedAdminOrEmployer, handleMultiMediaUpload, updateSkill);
module.exports = router;