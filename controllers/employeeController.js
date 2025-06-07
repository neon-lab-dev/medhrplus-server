const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Emp = require("../models/employee.js");
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");
// const cloudinary = require("cloudinary");
const sendEmail = require("../utils/sendEmail.js");
const getDataUri = require("../utils/dataUri.js");
const fs = require("fs");
const { EMPLOYEE_AUTH_TOKEN } = require("../constants/cookies.constant");
const { uploadFile, deleteFile } = require("../utils/uploadFile.js");

async function deleteUsersWithExpiredOTP() {
  try {
    const currentTime = Date.now();
    await Emp.deleteMany({
      otp_expiry: { $lte: currentTime },
      otp: { $ne: null }, // Exclude users who have already verified OTP
    });
  } catch (error) {
    console.error("Error deleting users with expired OTP:", error);
  }
}

setInterval(deleteUsersWithExpiredOTP, 1 * 60 * 1000);

// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { full_name, mobilenumber, email, password, confirm_password } =
    req.body;

  if (!full_name || !mobilenumber || !email || !password || !confirm_password)
    return next(new ErrorHandler("Please fill all details", 400));

  if (password != confirm_password)
    return next(
      new ErrorHandler("Password and Confirm Password Doesn't Match", 400)
    );

  let user = await Emp.findOne({ email });

  if (user) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }

  const otp = Math.floor(Math.random() * 100000);

  user = await Emp.create({
    full_name,
    email,
    mobilenumber,
    password,
    otp,
    otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
  });

  const emailMessage = `Dear ${user.full_name},

Thank you for choosing MedHR Plus! 🏆

To ensure the security of your account and expedite your registration process, please verify your account by entering the following One-Time Password (OTP):

OTP: ${otp}

This OTP is exclusively for you and will expire after a limited time. 
  
Thank you for your trust in MeDHr Plus. We can't wait to see you in action!

Best regards,

MedHR Plus 🏅
    `;

  await sendEmail(email, "Verify your account", emailMessage);

  res.status(201).json({
    success: true,
    message: `OTP sent to ${email}`,
  });
});

//verify
exports.verify = catchAsyncErrors(async (req, res, next) => {
  const otp = Number(req.body.otp);

  const user = await Emp.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User Doesn't exist", 404));
  }

  if (user.otp !== otp || user.otp_expiry < Date.now()) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP or has been Expired" });
  }

  user.verified = true;
  user.otp = null;
  user.otp_expiry = null;

  await user.save();

  const emailMessage = `Dear ${user.full_name},

Thank you for choosing MedHR+! 🏆

You are a Verified User Start Your JOb/Internship search. 
  
Thank you for your trust in Carrer Hub. We can't wait to see you in action!

Best regards,

MedHR+ 🏅
    `;

  await sendEmail(user.email, "Welcome To MedHR+", emailMessage);

  // Generate token manually
  const token = user.getJWTToken();

  // Construct user data
  const userData = {
    _id: user._id,
    full_name: user.full_name,
    email: user.email,
    phoneNo: user.phoneNo,
    verified: user.verified,
  };

  res.status(200).json({
    success: true,
    message: "Account verified. You can now log in.",
    user: userData,
    accessToken: token,
  });
});

//login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  // Find user by email and include password field
  const user = await Emp.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Compare passwords
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  
  // Generate token manually
  const token = user.getJWTToken();

  // Construct user data
  const userData = {
    _id: user._id,
    full_name: user.full_name,
    email: user.email,
    phoneNo: user.phoneNo,
    verified: user.verified,
  };

  // Send token in response without setting cookie
  res.status(200).json({
    success: true,
    message: "Logged in Successfully",
    user: userData,
    accessToken: token,
  });
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  // res.cookie(EMPLOYEE_AUTH_TOKEN, "", {
  //   expires: new Date(0), // Set the expiration date to a past date to immediately expire the cookie
  //   httpOnly: true,
  //   secure: "true", // Set to true in production, false in development
  //   sameSite: "None", // Ensure SameSite is set to None for cross-site cookies
  // });
  res.clearCookie(EMPLOYEE_AUTH_TOKEN);

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please enter email", 404));
  }

  const user = await Emp.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const frontendurl = `https://localhost:7000/reset-password/${resetToken}`;

  const message = `Dear ${user.name},

    We hope this email finds you well. It appears that you've requested to reset your password for your MedHR+ account. We're here to assist you in securely resetting your password and getting you back to enjoying our platform hassle-free.

    To reset your password, please click on the following link:

    ${frontendurl}

    This link will expire in 15 minutes for security reasons, so please make sure to use it promptly. If you didn't initiate this password reset request, please disregard this email, and your account will remain secure.

    If you encounter any issues or have any questions, feel free to reach out to our support team at [support email] for further assistance. We're here to help you every step of the way.

    Thank you for choosing MedHR+. We appreciate your continued support.

    Best regards,
    MedHR+ Team`;

  try {
    await sendEmail(
      user.email,
      "Password Reset Link for Carrer Hub Account",
      message
    );

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await Emp.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (!req.body.password || !req.body.confirmPassword) {
    return next(new ErrorHandler("Please Enter Password", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully ",
  });
});

//Enter Education,Address and other details
// exports.EnterUserDetails = catchAsyncErrors(async (req, res, next) => {
//   const {
//     address,
//     education,
//     experience,
//     projects,
//     certifications,
//     skills,
//     socialLinks,
//     interests, // Corrected spelling from 'intrests' to 'interests'
//   } = req.body;

//   // Validate that each field is an array
//   // if (
//   //   !Array.isArray(address) ||
//   //   !Array.isArray(education) ||
//   //   !Array.isArray(experience) ||
//   //   !Array.isArray(projects) ||
//   //   !Array.isArray(skills)
//   // ) {
//   //   return next(new ErrorHandler("Please Enter All Fields", 400));
//   // }

//   // Assuming req.user contains the authenticated user info
//   const userId = req.user.id;

//   // Update user details in the database
//   const updatedUser = await Emp.findByIdAndUpdate(
//     userId,
//     {
//       address,
//       education,
//       experience,
//       projects,
//       certifications,
//       skills,
//       socialLinks,
//       interests,
//     },
//     { new: true, runValidators: true }
//   );

//   if (!updatedUser) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   res.status(201).json({
//     success: true,
//     message: "Details Updated Successfully",
//   });
// });

exports.EnterUserDetails = catchAsyncErrors(async (req, res, next) => {
  const {
    dob,
    designation,
    gender,
    guardian,
    preferredLanguages,
    areasOfInterests,
    currentlyLookingFor,
    address,
    education,
    experience,
    projects,
    certifications,
    skills,
    socialLinks,
    interests,
  } = req.body;

  // Assuming req.user contains the authenticated user info
  const userId = req.user.id;

  // Create an empty object to hold the fields that the user provided
  const updateFields = {};

  // Dynamically add fields to updateFields if they are provided in the request
  if (dob) updateFields.dob = dob;
  if (designation) updateFields.designation = designation;
  if (gender) updateFields.gender = gender;
  if (guardian) updateFields.guardian = guardian;
  if (preferredLanguages) updateFields.preferredLanguages = preferredLanguages;
  if (areasOfInterests) updateFields.areasOfInterests = areasOfInterests;
  if (currentlyLookingFor)
    updateFields.currentlyLookingFor = currentlyLookingFor;
  if (address) updateFields.address = address;
  if (education) updateFields.education = education;
  if (experience) updateFields.experience = experience;
  if (projects) updateFields.projects = projects;
  if (certifications) updateFields.certifications = certifications;
  if (skills) updateFields.skills = skills;
  if (socialLinks) updateFields.socialLinks = socialLinks;
  if (interests) updateFields.interests = interests;

  // Update user details in the database only with the provided fields
  const updatedUser = await Emp.findByIdAndUpdate(userId, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(201).json({
    success: true,
    message: "Details Updated Successfully",
  });
});

//get user details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await Emp.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

//update user details
exports.updateUserDetails = catchAsyncErrors(async (req, res, next) => {
  const { full_name, email, mobilenumber, dob } = req.body;

  const file = req.file;

  const user = await Emp.findById(req.user.id);

  if (full_name) user.full_name = full_name;
  if (email) user.email = email;
  if (mobilenumber) user.mobilenumber = mobilenumber;
  if (dob) user.dob = dob;

  if (!user.avatar) {
    user.avatar = {};
  }

  if (file) {
    const fileUri = getDataUri(file);
    // const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    //   folder: "avatars",
    //   width: 150,
    //   crop: "scale",
    // });

    const mycloud = await uploadFile(
      fileUri.content,
      "fileUri.fileName",
      "avatars"
    );
    //Destroy existing avatar if present
    if (user.avatar.public_id) {
      //await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      await deleteFile(user.avatar.public_id);
    }

    // user.avatar = {
    //   public_id: mycloud.public_id,
    //   url: mycloud.secure_url,
    // };
    user.avatar = {
      public_id: mycloud.fileId,
      url: mycloud.url,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile is updated successfully ",
  });
});

// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.oldPassword) {
    return next(new ErrorHandler("please enter your OLd password", 400));
  }

  const user = await Emp.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully ",
  });
});

//upload/replace resume
exports.uploadUserResume = catchAsyncErrors(async (req, res, next) => {
  const file = req.file;
  const user = await Emp.findById(req.user._id);

  if (!user.resumes) {
    user.resumes = {};
  }

  if (file) {
    const fileUri = getDataUri(file);
    //const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
    const mycloud = await uploadFile(
      fileUri.content,
      fileUri.fileName,
      "resumes"
    );

    // Destroy existing avatar if present
    if (user.resumes.public_id) {
      // await cloudinary.v2.uploader.destroy(user.resumes.public_id);
      await deleteFile(user.resumes.public_id);
    }

    // user.resumes = {
    //   public_id: mycloud.public_id,
    //   url: mycloud.secure_url,
    // };
    user.resumes = {
      public_id: mycloud.fileId,
      url: mycloud.url,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Resume is updated successfully ",
  });
});
