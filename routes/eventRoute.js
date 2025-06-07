const express = require("express");
const { isAuthenticatedAdmin, isAuthenticatedAdminOrEmployer, isAuthenticatedEmployeer } = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const { createEvent, getAllEvents, getEventById, deleteEvent, updateEvent, getAllEmployerEvents } = require("../controllers/eventController");
const router = express.Router();

// Only for admin
router.post("/events/create-event", isAuthenticatedAdminOrEmployer, singleUpload, createEvent);
router.delete("/events/:id", isAuthenticatedAdminOrEmployer, deleteEvent);
router.put("/events/update/:id", isAuthenticatedAdminOrEmployer, singleUpload, updateEvent);

router
  .route("/employeer/events")
  .get(isAuthenticatedEmployeer, getAllEmployerEvents);
// Public routes
router.get("/events", getAllEvents);
router.get("/event/:id", getEventById);

module.exports = router;
