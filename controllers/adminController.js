const sendEmail = require("../utils/sendEmail");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Admin = require("../models/admin");
const Employeer = require("../models/employeer.js");
const Employee = require("../models/employee.js");
const { ADMIN_AUTH_TOKEN } = require("../constants/cookies.constant");
const sendToken = require("../utils/jwtToken");
const ApiFeatures = require("../utils/apifeatures.js");
const Jobs = require("../models/jobs.js");
const Search = require("../utils/search.js");

exports.registerAdmin = catchAsyncErrors(async (req, res, next) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }
  let existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return next(new ErrorHandler("Email already exists", 400));
  }

  const admin = await Admin.create({
    full_name,
    email,
    password,
  });

  res.status(201).json({
    success: true,
    data: admin,
    message: "Admin created successfully",
  });
});

exports.loginAdmin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const token = admin.getJWTToken();

  res.status(200).json({
    success: true,
    message: "Admin Logged in Successfully",
    user: {
      _id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      phoneNo: admin.phoneNo,
      verified: admin.verified,
    },
    accessToken: token,
  });
});


exports.logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res.cookie(ADMIN_AUTH_TOKEN, "", {
    expires: new Date(0), // Set the expiration date to a past date to immediately expire the cookie
    httpOnly: true,
    secure: "true", // Set to true in production, false in development
    sameSite: "None", // Ensure SameSite is set to None for cross-site cookies
  });

  res.status(200).json({
    success: true,
    message: "Admin Logged Out Successfully",
  });
});

exports.adminProfile = catchAsyncErrors(async (req, res, next) => {
  const admin = await Admin.findById(req.admin.id);
  res.status(200).json({
    success: true,
    admin,
  });
});

exports.getAllEmployers = catchAsyncErrors(async (req, res, next) => {
  const resultsPerPage = 15;
  const employersCount = await Employeer.countDocuments();
  const apiFeatures = new Search(Employeer.find(), req.query)
    .search()
    .pagination(resultsPerPage);
  const employers = await apiFeatures.query;
  const filteredEmployersCount = employers.length;

  res.status(200).json({
    success: true,
    employersCount,
    employers,
    filteredEmployersCount,
  });
});

exports.getSingleEmployer = catchAsyncErrors(async (req, res, next) => {
  const employer = await Employeer.findById(req.params.id);
  if (!employer) {
    return next(new ErrorHandler("Employer doesn't exist with this ID", 404));
  }
  res.status(200).json({
    success: true,
    employer,
  });
});

exports.deleteEmployer = catchAsyncErrors(async (req, res, next) => {
  const employer = await Employeer.findById(req.params.id);
  if (!employer) {
    return next(new ErrorHandler("Employer doesn't exist with this ID", 404));
  }
  await employer.deleteOne();
  res.status(200).json({
    success: true,
    message: "Employer deleted successfully",
    data: employer
  });
});

exports.getAllEmployees = catchAsyncErrors(async (req, res, next) => {
  const resultsPerPage = 15;
  const employeeCount = await Employee.countDocuments();
  const apiFeatures = new Search(Employee.find(), req.query)
    .search()
    .pagination(resultsPerPage);
  const employees = await apiFeatures.query;
  const filteredEmployersCount = employees.length;
  res.status(200).json({
    success: true,
    employeeCount,
    employees,
    filteredEmployersCount,
  });
});

exports.getSingleEmployee = catchAsyncErrors(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return next(new ErrorHandler("Employee doesn't exist with this ID", 404));
  }
  res.status(200).json({
    success: true,
    employee,
  });
});

exports.deleteEmployee = catchAsyncErrors(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return next(new ErrorHandler("Employee doesn't exist with this ID", 404));
  }
  await employee.deleteOne();
  res.status(200).json({
    success: true,
    message: "Employee deleted successfully",
    data: employee
  });
});

exports.counts = catchAsyncErrors(async (req, res, next) => {
  const employersCount = await Employeer.countDocuments();
  const employeesCount = await Employee.countDocuments();
  const totalJobs = await Jobs.find().populate("applicants");
  let hiredApplicantsCount = 0;
  totalJobs.forEach(job => {
    hiredApplicantsCount += job.applicants.filter(applicant => applicant.status === "HIRED").length;
  });
  res.status(200).json({
    success: true,
    jobsCount: totalJobs.length,
    employersCount,
    employeesCount,
    hiredApplicantsCount
  });
});

exports.deletejob = catchAsyncErrors(async (req, res, next) => {
  const job = await Jobs.findOne({
    _id: req.params.id,
  });

  if (!job) {
    return next(new ErrorHandler("Not found or you are not authorized", 404));
  }


  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Deleted Successfully",
  });

});

exports.contact = catchAsyncErrors(async (req, res, next) => {
  const { name, email, number, city, message } = req.body;
  if (!name || !email || !number || !city || !message) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const text = `
    ${name} from ${city} with phone number ${number} has sent you a message:
    ${message} And can be reached at ${email}!
  `;

  try {
    await sendEmail(
      process.env.ADMIN_EMAIL,
      "You have received a new contact message",
      text
    );

    res.status(200).json({
      success: true,
      message: `Contact message sent successfully!`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Something went wrong while sending the contact message!`,
    });
  }
});
