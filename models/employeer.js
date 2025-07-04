const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const employeerSchema = new mongoose.Schema({
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
  address: [
    {
      street: { type: String },
      city: { type: String},
      state: { type: String },
      postalCode: { type: String},
      country: { type: String },
    },
  ],
  companyDetails: [
    {
      companyName: {
        type: String,
      },
      industryType: {
        type: String,
      },
      websiteLink: {
        type: String,
      },
      contactEmail: {
        type: String,
      },
      contactPhone: {
        type: Number,
      },
      companyLocation: {
        type: String,
      },
      bio: {
        type: String,
      },
      soicalLink: {
        linkedin: { type: String },
        github: { type: String },
      },
    },
  ],
  company_avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
  },

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
employeerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

//JWT TOKEN
employeerSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: "employeer" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//comapare password
employeerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generating password Reset Token
employeerSchema.methods.getResetPasswordToken = function () {
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

employeerSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 }, {
  full_name: "text"
});

module.exports = mongoose.model("Employeer", employeerSchema);
