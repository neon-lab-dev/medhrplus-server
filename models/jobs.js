const mongoose = require("mongoose");

const ApplicantSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["APPLIED", "REJECTED", "HIRED", "INTERVIEW"],
    default: "APPLIED",
  },
  isViewed: {
    type: Boolean,
    default: false,
  },
});
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  // Array of strings
  requiredSkills: [
    {
      type: String,
      required: true,
    },
  ], // Array of strings
  responsibilities: {
    type: String,
    required: true,
  },
  locationType: {
    type: String,
    enum: ["Remote", "Onsite", "Hybrid"],
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  employmentType: {
    type: String,
    enum: ["Job", "Internship"],
    required: true,
  },
  employmentTypeCategory: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        if (this.employmentType === "Job") {
          return ["Full-Time", "Part-Time", "Contract"].includes(value);
        } else if (this.employmentType === "Internship") {
          return ["Shadow Internship", "Practice Internship"].includes(value);
        }
        return false;
      },
      message: (props) =>
        `${props.value} is not a valid employmentTypeCategory for ${props.instance.employmentType}`,
    },
  },

  typeOfOrganization: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },

  employmentDuration: {
    type: Number,
    required: false,
  },
  salary: {
    type: Number,
    required: false,
  }, // Optional
  companyDetails: {
    type: {
      companyName: String,
      industryType: String,
      websiteLink: String,
      bio: String,
      logo: String,
    },
    required: false,
  },

  postedBy: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },

  postedAt: {
    type: Date,
    default: Date.now,
  },
  applicationDeadline: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ["Open", "Closed"],
    default: "Open",
  },
  extraBenefits: {
    type: String,
    required: false,
    default: "",
  },
  experience: {
    type: String,
    required: false,
    default: "",
  },
  applicants: [ApplicantSchema], // Array of applicant IDs
});
jobSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Jobs", jobSchema);
