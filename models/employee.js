const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const empSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, "Please Enter Your full Name"],
    maxLength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  mobilenumber: {
    type: Number,
    required: [true, "Please Enter your mobile number"],
  },

  password: {
    type: String,
    required: [true, "Please Enter your password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
  },
  dob: {
    type: String,
  },
  designation: {
    type: String,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  guardian: {
    guardianName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    occupation: {
      type: String,
    },
  },
  preferredLanguages: [
    {
      type: String,
    },
  ],
  areasOfInterests: [
    {
      type: String,
    },
  ],
  currentlyLookingFor: [
    {
      type: String,
    },
  ],
  interestedDepartments: [
    {
      type: String,
    },
  ],
  interestedCountries: [
    {
      type: String,
    },
  ],
  address: {
      street: { type: String },
      city: { type: String },
      postalCode: { type: String },
      state: { type: String },
      country: { type: String },
    },
  education: [
    {
      designationType: { type: String },
      institutionName: { type: String },
      city: { type: String },
      courseName: { type: String },
      grade: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      // fieldOfStudy: { type: String },
    },
  ],
  projects: [
    {
      title: { type: String },
      description: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      link: { type: String },
    },
  ],
  experience: [
    {
      designation: { type: String },
      companyName: { type: String },
      workType: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
      companyLocation: { type: String },
      projectLinks: { type: [String] },
    },
  ],
  certifications: [
    {
      name: { type: String },
      issuingOrganization: { type: String },
      issueDate: { type: Date },
      // expirationDate: { type: Date },
      credentialID: { type: String },
      credentialURL: { type: String },
    },
  ],
  resumes: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  skills: [
    {
      type: String,
    },
  ],
  socialLinks: {
    linkedin: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    github: { type: String },
    youtube: { type: String },
    dribble: { type: String },
    behance: { type: String },
    medium: { type: String },
    stackoverflow: { type: String },
    reddit: { type: String },
    tiktok: { type: String },
    snapchat: { type: String },
    pinterest: { type: String },
    telegram: { type: String },
    discord: { type: String },
  },  
  interests: [
    {
      type: String,
    },
  ],

  verified: {
    type: Boolean,
    default: false,
  },
  otp: Number,
  otp_expiry: Date,

  createdAt: {
    type: Date,
    default: Date.now(),
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

//hashing the password
empSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

//JWT TOKEN
empSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: "employee" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//compare password
empSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generating password Reset Token
empSchema.methods.getResetPasswordToken = function () {
  //Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //Hashing and adding resetPasswordToken to user schema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

empSchema.index(
  { otp_expiry: 1 },
  { expireAfterSeconds: 0 },
  { full_name: "text" }
);
module.exports = mongoose.model("Employee", empSchema);
