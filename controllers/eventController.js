const Event = require("../models/events.js");
const getDataUri = require("../utils/dataUri");
const ErrorHandler = require("../utils/errorhandler");
const { uploadFile, deleteFile } = require("../utils/uploadFile");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures.js");

// Get all events
exports.createEvent = catchAsyncErrors(async (req, res, next) => {
  const { date, time, eventName, eventUrl, company, skillCovered, organizerName, organizationType, department } = req.body;

  if (!date || !time || !eventName || !eventUrl || !company || !skillCovered) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  const file = req.file;
  if (!file) {
    return next(new ErrorHandler("Please Upload an Event Image", 400));
  }

  try {
    const imageUri = getDataUri(file);
    const uploadedImage = await uploadFile(
      imageUri.content,
      imageUri.fileName,
      "event-thumbnails"
    );

    const event = await Event.create({
      date,
      time,
      eventName,
      eventUrl,
      organizerName : organizerName || "",
      organizationType : organizationType || "",
      department : department || "",
      company: JSON.parse(company),
      skillCovered: JSON.parse(skillCovered) || [],
      image: {
        fileId: uploadedImage.fileId,
        name: uploadedImage.name,
        url: uploadedImage.url,
      },
      postedBy: req?.user?.id || req?.admin?.id,
    });

    // const populatedEvent = await Event.findById(event?._id).populate(
    //   "postedBy",
    //   "full_name email"
    // );

    res.status(201).json({
      success: true,
      event: event,
      message: "Event created successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all events for admin
exports.getAllEvents = catchAsyncErrors(async (req, res, next) => {
  const events = await Event.find().populate("postedBy", "full_name email");
  res.status(200).json({
    success: true,
    data: events,
  });
});

// Get all courses for employer
exports.getAllEmployerEvents = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 15;
  const eventsCount = await Event.countDocuments({ postedBy: req.user.id });

  const apiFeature = new ApiFeatures(
    Event.find({ postedBy: req.user.id }),
    req.query
  )
    .search()
    .filter()
    .pagination(resultPerPage);
  const events = await apiFeature.query;

  res.status(200).json({
    success: true,
    eventsCount,
    events,
    resultPerPage,
    filteredJobsCount: events.length,
  });
});

// Get single event by ID
exports.getEventById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const event = await Event.findById(id).populate(
    "postedBy",
    "full_name email"
  );

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

// Update event by id
exports.updateEvent = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  let { eventName, eventUrl, date, time, company, skillCovered, organizerName, organizationType, department } = req.body;

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // 🔐 Authorization Check
  const isAdmin = req.admin;
  const isOwner =
    req.user && event.postedBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return next(
      new ErrorHandler("You are not authorized to update this event", 403)
    );
  }

  // Update simple fields
  if (eventName) event.eventName = eventName;
  if (eventUrl) event.eventUrl = eventUrl;
  if (date) event.date = date;
  if (time) event.time = time;
  if (organizerName) event.organizerName = organizerName;
  if (organizationType) event.organizationType = organizationType;
  if (department) event.department = department;

  // Parse and update company
  if (company) {
    try {
      const parsedCompany = JSON.parse(company);
      if (!event.company) {
        event.company = {};
      }
      if (parsedCompany.companyName)
        event.company.companyName = parsedCompany.companyName;
      if (parsedCompany.companyLocation)
        event.company.companyLocation = parsedCompany.companyLocation;
    } catch (error) {
      console.error("Failed to parse company JSON:", error);
    }
  }

  // Parse and update skillCovered
  if (skillCovered) {
    try {
      const parsedSkills = JSON.parse(skillCovered);
      if (Array.isArray(parsedSkills)) {
        event.skillCovered = parsedSkills;
      }
    } catch (error) {
      console.error("Failed to parse skillCovered JSON:", error);
    }
  }

  // Handle image upload
  const imageFile = req.file;
  if (imageFile) {
    if (event.image) {
      await deleteFile(event.image.fileId);
    }

    const imageUri = getDataUri(imageFile);
    const image = await uploadFile(
      imageUri.content,
      imageUri.fileName,
      "event-images"
    );

    event.image = {
      fileId: image.fileId,
      name: image.name,
      url: image.url,
    };
  }

  await event.save();

  const populatedEvent = await Event.findById(event._id).populate(
    "image",
    "name url createdAt"
  );

  res.status(200).json({
    success: true,
    event: populatedEvent,
  });
});

// Delete an event by ID
exports.deleteEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // 🔐 Authorization Check
  const isAdmin = req.admin;
  const isOwner =
    req.user && event.postedBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return next(
      new ErrorHandler("You are not authorized to update this event", 403)
    );
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});
