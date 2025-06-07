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

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, "Please Enter Your Course Name"],
    },
    courseOverview: {
      type: String,
      required: [true, "Please Enter Your Course Description In Short"],
    },
    courseDescription: {
      type: String,
    },
    courseType: {
      type: String,
      enum: ["Certificate", "Diploma", "Bachelor", "Master"],
      required: [true, "Please Select Course Type"],
    },
    department: {
      type: String,
      required: [true, "Please Enter Course Department Name"],
    },
    duration: {
      type: String,
      required: [true, "Please Enter Course Duration"],
    },
    desiredQualificationOrExperience: {
      type: String,
    },
    courseLink: {
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

module.exports = mongoose.model("Courses", courseSchema);
