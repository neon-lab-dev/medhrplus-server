const mongoose = require("mongoose");
const { FileSchema } = require("./file.js");

const ApplicantSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
});
const skillSchema = new mongoose.Schema(
  {
    skillProgrammeName: {
      type: String,
      required: [true, "Please Enter Your Skill Programme Name"],
    },
    programmeOverview: {
      type: String,
      required: [true, "Please Enter Your Programme Overview"],
    },
    programmeDescription: {
      type: String,
    },
    programmeType: {
      type: String,
      enum: ["Offline", "Online", "Fellowship", "Scholarships", "Events"],
    },
    department: {
      type: String,
      required: [true, "Please Enter Programme Department Name"],
    },
    duration: {
      type: String,
      required: [true, "Please Enter Programme Duration"],
    },
    desiredQualificationOrExperience: {
      type: String,
    },
    programmeLink: {
      type: String,
    },
    pricingType: {
      type: String,
      default: "Free",
    },
    fee: {
      type: Number,
      default: 0,
    },
    numberOfSeats: {
      type: Number,
      default: 0,
    },
    isIncludedCertificate: {
      type: Boolean,
      default: false,
    },
    thumbnail: FileSchema,
    applicants: [ApplicantSchema], // Array of applicant IDs
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employeer",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Skills", skillSchema);
