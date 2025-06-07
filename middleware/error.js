const ErrorHandler = require("../utils/errorhandler");

module.exports = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    err.message = `Resource not Found. Invalid: ${err.path}`;
    err.statusCode = 400;
  }

  if (err.code === 11000) {
    err.message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err.statusCode = 400;
  }

  if (err.name === "JsonWebTokenError") {
    err.message = "Json web Token is invalid. Try again";
    err.statusCode = 400;
  }

  if (err.name === "TokenExpiredError") {
    err.message = "Json web Token is expired. Try again";
    err.statusCode = 400;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
