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
      new ErrorHandler("Password and Confirm Password Doesn't Match", 400),
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

  const emailMessage = `
<div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#f9533a;padding:20px;text-align:center;color:#ffffff;">
      <h2 style="margin:0;">Med HR Plus</h2>
      <p style="margin:5px 0 0;font-size:14px;">Account Verification</p>
    </div>

    <!-- Body -->
    <div style="padding:30px;">
      
      <p style="font-size:16px;color:#333;margin-bottom:10px;">
        Dear ${user.full_name},
      </p>

      <p style="font-size:15px;color:#555;line-height:1.6;">
        Thank you for choosing <strong>Med HR Plus</strong> 🏆
      </p>

      <p style="font-size:15px;color:#555;line-height:1.6;">
        To ensure the security of your account and complete your registration,
        please use the OTP below:
      </p>

      <!-- OTP BOX -->
      <div style="margin:30px 0;text-align:center;">
        <div style="display:inline-block;padding:15px 25px;background:#fff5f3;border:2px dashed #f9533a;border-radius:8px;">
          <p style="margin:0;font-size:13px;color:#777;">Your OTP Code</p>
          <h1 style="margin:10px 0;color:#f9533a;letter-spacing:5px;">
            ${otp}
          </h1>
        </div>
      </div>

      <p style="font-size:14px;color:#777;">
        This OTP is valid for a limited time. Please do not share it with anyone.
      </p>

      <p style="font-size:15px;color:#555;line-height:1.6;">
        Thank you for your trust in Med HR Plus. We can't wait to see you in action!
      </p>

      <br/>

      <p style="font-size:15px;color:#333;">
        Best regards,<br/>
        <strong>Team Med HR Plus</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#fafafa;padding:15px;text-align:center;font-size:12px;color:#999;">
      © ${new Date().getFullYear()} Med HR Plus. All rights reserved.
    </div>

  </div>
</div>
`;

  await sendEmail(email, "Welcome Onboaring MEDHR OTP verification", emailMessage);

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

  const emailMessage = `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px;">
    
    <p style="font-size: 16px; color: #333;">
      Dear ${user.full_name},
    </p>

    <p style="font-size: 15px; color: #555;">
      Warm regards from <strong>Med HR Plus</strong> 
      (Ms. Monchi Health & Education Consultancy LLP)
    </p>

    <p style="font-size: 15px; color: #555;">
      We wish you well and encourage you to continue developing your profession in the medical field.
    </p>

    <p style="font-size: 15px; color: #555;">
      We appreciate you selecting us. We guarantee that we will assist you in better shaping your career.
      For further chances and updates on internships, jobs, skill programs, courses, and events, please remember to check our website: <a href="https://www.medhrplus.com" style="color: #f9533a; font-weight: bold;">
        www.medhrplus.com
      </a>
    </p>

    <p style="font-size: 15px; color: #555;">
      Since you are a Verified User, we assume you have accepted all of 
      <a href="https://www.medhrplus.com" style="color: #f9533a;">www.medhrplus.com</a>'s terms and conditions.
    </p>

    <p style="font-size: 15px; color: #555;">
      I appreciate your confidence. We are eager to watch you in action!
    </p>

    <br/>

    <p style="font-size: 15px; color: #333;">
      Warm regards,<br/>
      <strong>Team MedHrPlus</strong>
    </p>

  </div>
</div>
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
      message,
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
        400,
      ),
    );
  }
  if (!user?.isPaid) {
    return next(
      new ErrorHandler("Please complete your payment to continue.", 400),
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
    interestedCountries,
    interestedDepartments,
    address,
    education,
    experience,
    projects,
    certifications,
    skills,
    socialLinks,
    interests,
  } = req.body;

  const userId = req.user.id;
  const updateFields = {};

  if (dob) updateFields.dob = dob;
  if (designation) updateFields.designation = designation;
  if (gender) updateFields.gender = gender;
  if (guardian) updateFields.guardian = guardian;
  if (preferredLanguages) updateFields.preferredLanguages = preferredLanguages;
  if (areasOfInterests) updateFields.areasOfInterests = areasOfInterests;
  if (currentlyLookingFor)
    updateFields.currentlyLookingFor = currentlyLookingFor;
  if (interestedCountries)
    updateFields.interestedCountries = interestedCountries;
  if (interestedDepartments)
    updateFields.interestedDepartments = interestedDepartments;
  if (address) updateFields.address = address;
  if (education) updateFields.education = education;
  if (experience) updateFields.experience = experience;
  if (projects) updateFields.projects = projects;
  if (certifications) updateFields.certifications = certifications;
  if (skills) updateFields.skills = skills;
  if (socialLinks) updateFields.socialLinks = socialLinks;
  if (interests) updateFields.interests = interests;

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
  const user = await Emp.findById(req.user.id);

  // Loop over all keys in req.body and update user object dynamically
  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      user[key] = req.body[key];
    }
  });

  // Handle avatar update if file exists
  if (!user.avatar) {
    user.avatar = {};
  }

  if (req.file) {
    const fileUri = getDataUri(req.file);
    const mycloud = await uploadFile(
      fileUri.content,
      "fileUri.fileName",
      "avatars",
    );

    if (user.avatar.public_id) {
      await deleteFile(user.avatar.public_id);
    }

    user.avatar = {
      public_id: mycloud.fileId,
      url: mycloud.url,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile is updated successfully",
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
      "resumes",
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
