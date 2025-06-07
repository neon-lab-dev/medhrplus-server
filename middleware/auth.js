// Needs to be rewritten
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const Employee = require("../models/employee");
const Employeer = require("../models/employeer");
const Admin = require("../models/admin");
const {
  EMPLOYER_AUTH_TOKEN,
  EMPLOYEE_AUTH_TOKEN,
  ADMIN_AUTH_TOKEN,
} = require("../constants/cookies.constant");
const employeer = require("../models/employeer");

//for employee
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies;

  if (!token[EMPLOYEE_AUTH_TOKEN]) {
    return next(new ErrorHandler("Please Login as Employee", 401));
  }

  let decodedData;
  try {
    decodedData = jwt.verify(
      token[EMPLOYEE_AUTH_TOKEN],
      process.env.JWT_SECRET
    );
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
  const token = req.cookies;

  if (!token[EMPLOYER_AUTH_TOKEN]) {
    return next(new ErrorHandler("Please Login as Employer", 401));
  }

  let decodedData;
  try {
    decodedData = jwt.verify(
      token[EMPLOYER_AUTH_TOKEN],
      process.env.JWT_SECRET
    );
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
  const token = req.cookies;
  if (!token[ADMIN_AUTH_TOKEN]) {
    return next(new ErrorHandler("Please Login as Admin", 401));
  }
  let decodedData;
  try {
    decodedData = jwt.verify(token[ADMIN_AUTH_TOKEN], process.env.JWT_SECRET);
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

exports.isAuthenticatedAdminOrEmployer = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies;

  const adminToken = token[ADMIN_AUTH_TOKEN];
  const employerToken = token[EMPLOYER_AUTH_TOKEN];

  let decodedData;

  if (adminToken) {
    try {
      decodedData = jwt.verify(adminToken, process.env.JWT_SECRET);
      if (!decodedData || !decodedData.id) {
        return next(new ErrorHandler("Invalid admin token", 401));
      }

      const admin = await Admin.findById(decodedData.id);
      if (!admin) {
        return next(new ErrorHandler("Admin not found", 404));
      }

      req.admin = admin;
      return next();
    } catch (error) {
      return next(new ErrorHandler("Admin token invalid or expired", 401));
    }
  }

  if (employerToken) {
    try {
      decodedData = jwt.verify(employerToken, process.env.JWT_SECRET);
      if (!decodedData || !decodedData.id) {
        return next(new ErrorHandler("Invalid employer token", 401));
      }

      const employer = await Employeer.findById(decodedData.id);
      if (!employer) {
        return next(new ErrorHandler("Employer not found", 404));
      }

      req.user = employer;
      return next();
    } catch (error) {
      return next(new ErrorHandler("Employer token invalid or expired", 401));
    }
  }

  return next(new ErrorHandler("Please login as Admin or Employer", 401));
});
