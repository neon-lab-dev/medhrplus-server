const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyLocation: { type: String, required: true },
});

const eventSchema = new mongoose.Schema({
  image: {
    fileId: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  eventName: { type: String, required: true },
  eventUrl: { type: String, required: true },
  organizerName: { type: String },
  organizationType: { type: String },
  department: { type: String },
  date: { type: String, required: true },
  time: { type: String, required: true },
  company: { type: companySchema, required: true },
  skillCovered: { type: [String] },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employeer",
    required: true,
  },
});

module.exports = mongoose.model("Event", eventSchema);
