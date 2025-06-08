// Needs to be rewritten
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const Employee = require("../models/employee");
const Employeer = require("../models/employeer");
const Admin = require("../models/admin");
// const {
//   EMPLOYER_AUTH_TOKEN,
//   EMPLOYEE_AUTH_TOKEN,
//   ADMIN_AUTH_TOKEN,
// } = require("../constants/cookies.constant");
// const employeer = require("../models/employeer");

//for employee
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ErrorHandler("Please login as Employee", 401));
  }

  const token = authHeader.split(" ")[1];

  let decodedData;
  try {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(
      new ErrorHandler("Invalid or expired token, please login again", 401)
    );
  }

  if (!decodedData || !decodedData.id) {
    return next(
      new ErrorHandler("Invalid token data, please login again", 401)
    );
  }

  req.user = await Employee.findById(decodedData.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found, please login again", 404));
  }

  next();
});

//for employeer
exports.isAuthenticatedEmployeer = catchAsyncErrors(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ErrorHandler("Please login as Employer", 401));
  }

  const token = authHeader.split(" ")[1];

  let decodedData;
  try {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(
      new ErrorHandler("Invalid or expired token, please login again", 401)
    );
  }

  if (!decodedData || !decodedData.id) {
    return next(
      new ErrorHandler("Invalid token data, please login again", 401)
    );
  }

  req.user = await Employeer.findById(decodedData.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found, please login again", 404));
  }

  next();
});

exports.isAuthenticatedAdmin = catchAsyncErrors(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ErrorHandler("Please login as Admin", 401));
  }

  const token = authHeader.split(" ")[1];

  let decodedData;
  try {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(
      new ErrorHandler("Invalid or expired token, please login again", 401)
    );
  }

  if (!decodedData || !decodedData.id) {
    return next(
      new ErrorHandler("Invalid token data, please login again", 401)
    );
  }

  req.admin = await Admin.findById(decodedData.id);

  if (!req.admin) {
    return next(new ErrorHandler("Admin not found, please login again", 404));
  }

  next();
});

exports.isAuthenticatedAdminOrEmployer = catchAsyncErrors(
  async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ErrorHandler("Please login as Admin or Employer", 401));
    }

    const token = authHeader.split(" ")[1];

    let decodedData;
    try {
      decodedData = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next(
        new ErrorHandler("Invalid or expired token, please login again", 401)
      );
    }

    if (!decodedData || !decodedData.id || !decodedData.role) {
      return next(
        new ErrorHandler("Invalid token data, please login again", 401)
      );
    }

    if (decodedData.role === "admin") {
      const admin = await Admin.findById(decodedData.id);
      if (!admin) {
        return next(new ErrorHandler("Admin not found", 404));
      }
      req.admin = admin;
      return next();
    }

    if (decodedData.role === "employer") {
      const employer = await Employeer.findById(decodedData.id);
      if (!employer) {
        return next(new ErrorHandler("Employer not found", 404));
      }
      req.user = employer;
      return next();
    }

    return next(new ErrorHandler("Unauthorized role", 403));
  }
);
