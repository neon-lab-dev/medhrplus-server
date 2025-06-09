const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Employeer = require("../models/employeer.js");
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");
// const cloudinary = require("cloudinary");
const sendEmail = require("../utils/sendEmail.js");
const getDataUri = require("../utils/dataUri.js");
const { EMPLOYER_AUTH_TOKEN } = require("../constants/cookies.constant");
const ik = require("../config/imageKit.js");
const fs = require("fs");
const { uploadFile, deleteFile } = require("../utils/uploadFile.js");
const employee = require("../models/employee.js");

async function deleteUsersWithExpiredOTP() {
  try {
    const currentTime = Date.now();
    await Employeer.deleteMany({
      otp_expiry: { $lte: currentTime },
      otp: { $ne: null }, // Exclude users who have already verified OTP
    });
  } catch (error) {
    console.error("Error deleting users with expired OTP:", error);
  }
}

setInterval(deleteUsersWithExpiredOTP, 1 * 60 * 1000);

// Register a User
exports.registerEmployeer = catchAsyncErrors(async (req, res, next) => {
  const { full_name, mobilenumber, email, password, confirm_password } =
    req.body;

  if (!full_name || !mobilenumber || !email || !password || !confirm_password)
    return next(new ErrorHandler("Please fill all details", 400));

  if (password != confirm_password)
    return next(
      new ErrorHandler("Password and Confirm Password Doesn't Match", 400)
    );

  let user = await Employeer.findOne({ email });

  if (user) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }

  const otp = Math.floor(Math.random() * 100000);

  user = await Employeer.create({
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
  
Thank you for your trust in MedHr Plus. We can't wait to see you in action!

Best regards,

MedHR Plus 🏅
    `;

  await sendEmail(email, "Verify your account", emailMessage);

  res.status(201).json({
    success: true,
    message: "OTP sent to your registered Email ID",
  });
});

//verify
exports.verify = catchAsyncErrors(async (req, res, next) => {
  const otp = Number(req.body.otp);

  const user = await Employeer.findOne({ email: req.body.email });

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

Thank you for choosing MedHR Plus! 🏆

You are a Verified User Start Posting JOb/Internship. 
  
Thank you for your trust in MedHr Plus. We can't wait to see you in action!

Best regards,

MedHR Plus 🏅
    `;

  await sendEmail(user.email, "Welcome To MedHR Plus", emailMessage);

  const token = user.getJWTToken();

  res.status(200).json({
    success: true,
    message: "Account verified. You can now login",
    user: {
      _id: user.id,
      full_name: user.full_name,
      email: user.email,
      phoneNo: user.phoneNo,
      verified: user.verified,
    },
    accessToken: token,
  });
});

//send email to employee
exports.sendHiredEmail = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const { companyName } = req.body;

  const user = await employee.findById(userId);

  if (!user) {
    return next(new ErrorHandler("Candidate not found", 404));
  }

  const emailMessage = `Dear ${user?.full_name},

🎉 Congratulations! 🎉

We are thrilled to inform you that you have been selected at ${companyName} for the job position you applied for through MedHR Plus.

Your dedication and profile impressed the hiring team, and we’re excited to have you on board!

Please expect further communication from the employer regarding next steps. In the meantime, feel free to explore other opportunities on MedHR Plus.

Welcome to a new chapter of your career journey 🚀

Best regards,  
MedHR Plus Team
`;

  await sendEmail(
    user?.email,
    "🎉 You're Hired – Welcome Aboard!",
    emailMessage
  );

  return res.status(200).json({
    success: true,
    message: "Hired email sent successfully to the candidate.",
  });
});

//login user
exports.loginEmployeer = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await Employeer.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Generate token
  const token = user.getJWTToken();

  // Send response without setting cookies
  res.status(200).json({
    success: true,
    message: "Logged in Successfully!",
    user: {
      _id: user.id,
      full_name: user.full_name,
      email: user.email,
      phoneNo: user.phoneNo,
      verified: user.verified,
      role : user.role,
    },
    accessToken: token,
  });
});


// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie(EMPLOYER_AUTH_TOKEN, "", {
    expires: new Date(0), // Set the expiration date to a past date to immediately expire the cookie
    httpOnly: true,
    secure: "true", // Set to true in production, false in development
    sameSite: "None", // Ensure SameSite is set to None for cross-site cookies
  });

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

  const user = await Employeer.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const frontendurl = `https://localhost:7000/reset-password/${resetToken}`;

  const message = `Dear ${user.name},

    We hope this email finds you well. It appears that you've requested to reset your password for your MedHr Plus account. We're here to assist you in securely resetting your password and getting you back to enjoying our platform hassle-free.

    To reset your password, please click on the following link:

    ${frontendurl}

    This link will expire in 15 minutes for security reasons, so please make sure to use it promptly. If you didn't initiate this password reset request, please disregard this email, and your account will remain secure.

    If you encounter any issues or have any questions, feel free to reach out to our support team at [support email] for further assistance. We're here to help you every step of the way.

    Thank you for choosing MedHr Plus. We appreciate your continued support.

    Best regards,
    MedHr Plus Team`;

  try {
    await sendEmail(
      user.email,
      "Password Reset Link for MedHr Plus Account",
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

  const user = await Employeer.findOne({
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

//Enter company Details
// exports.EnterEmployeerDetails = catchAsyncErrors(async (req, res, next) => {
//   const { address, companyDetails } = req.body;

//   if (!Array.isArray(address) || !Array.isArray(companyDetails)) {
//     return next(new ErrorHandler("Please Enter All Fields", 400));
//   }

//   // Assuming req.user contains the authenticated user info
//   const userId = req.user.id;

//   // Update user details in the database
//   const updatedUser = await Employeer.findByIdAndUpdate(
//     userId,
//     {
//       address,
//       companyDetails,
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

exports.EnterEmployeerDetails = catchAsyncErrors(async (req, res, next) => {
  const { address, companyDetails } = req.body;

  // Assuming req.user contains the authenticated user info
  const userId = req.user.id;

  // Create an empty object to hold the fields that the user provided
  const updateFields = {};

  // Dynamically add fields to updateFields if they are provided in the request
  if (address) updateFields.address = address;
  if (companyDetails) updateFields.companyDetails = companyDetails;

  // Update user details in the database only with the provided fields
  const updatedUser = await Employeer.findByIdAndUpdate(userId, updateFields, {
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

//get employer profile
exports.getEmployerDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await Employeer.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updateEmployeerDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    const { full_name, email, mobilenumber } = req.body;
    const file = req.file;
    const user = await Employeer.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    if (mobilenumber) user.mobilenumber = mobilenumber;

    if (!user.company_avatar) {
      user.company_avatar = {};
    }

    if (file) {
      const fileUri = getDataUri(file);
      const result = await uploadFile(
        fileUri.content,
        fileUri.fileName,
        "company_avatar"
      );
      if (user.company_avatar.public_id && user.company_avatar.url) {
        await deleteFile(user.company_avatar.public_id);
      }
      user.company_avatar = {
        public_id: result.fileId,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
      };
    }
    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error,
    });
  }
});
// update Employeer password
exports.updatePasswordEmployeer = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.oldPassword) {
    return next(new ErrorHandler("Please enter your old password", 400));
  }

  const user = await Employeer.findById(req.user.id).select("+password");

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

// Find candidates
exports.findCandidates = catchAsyncErrors(async (req, res, next) => {
  const {
    gender,
    country,
    city,
    skills,
    language,
    experience,
    designation,
    areaOfInterest,
    keyword,
    currentlyLookingFor,
    courseName,
    designationType,
  } = req.query;

  let query = {};

  if (gender) query.gender = gender;
  if (designation) query.designation = designation;
  if (country) query["address.country"] = country;
  if (city) query["address.city"] = city;
  if (areaOfInterest) {
    const designationArray = Array.isArray(areaOfInterest)
      ? areaOfInterest.split(",")
      : [areaOfInterest];
    query.areasOfInterests = {
      $elemMatch: { $regex: designationArray.join("|"), $options: "i" },
    };
  }

  if (experience) query.experience = { $gte: parseInt(experience) };

  // Filter by skills (Array)
  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : skills.split(",");
    query.skills = { $in: skillsArray };
  }

  // Filter by language (Array)
  if (language) {
    const languagesArray = Array.isArray(language)
      ? language
      : language.split(",");
    query.preferredLanguages = { $in: languagesArray };
  }

  // Filter by currently looking for -(Interest) (Array)
  if (currentlyLookingFor) {
    const currentlyLookingForArray = Array.isArray(currentlyLookingFor)
      ? currentlyLookingFor
      : currentlyLookingFor.split(",");
    query.currentlyLookingFor = { $in: currentlyLookingForArray };
  }

  // Filter by Course Name (Multiple Array)
  if (courseName) {
    const courseNameArray = Array.isArray(courseName)
      ? courseName
      : courseName.split(",");
  
    query.education = {
      $elemMatch: {
        courseName: { $in: courseNameArray.map(name => new RegExp(name, "i")) }
      },
    };
  }

  // Filter by designationType (Array)
  if (designationType) {
    const designationTypeArray = Array.isArray(designationType)
      ? designationType
      : designationType.split(",");
  
    if (query.education && query.education.$elemMatch) {
      query.education.$elemMatch.designationType = {
        $in: designationTypeArray.map(type => new RegExp(type, "i")),
      };
    } else {
      query.education = {
        $elemMatch: {
          designationType: {
            $in: designationTypeArray.map(type => new RegExp(type, "i")),
          },
        },
      };
    }
  }
  
  // Search by keyword in employee name
  if (keyword) query.full_name = { $regex: keyword, $options: "i" };

  // Fetch candidates based on query
  const candidates = await employee.find(query);

  if (!candidates.length) {
    return next(new ErrorHandler("No candidates found", 404));
  }

  res.status(200).json({
    success: true,
    candidates,
  });
});
