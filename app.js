const express = require("express");
const app = express();
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const NodeCache = require("node-cache");
// const {Cashfree} = require("cashfree-pg");

// Cashfree.XClientId = process.env.CASHFREE_X_CLIENT_ID;
// Cashfree.XClientSecret = process.env.CASHFREE_X_CLIENT_SECRET;
// Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

//config
dotenv.config({ path: "./config/config.env" });

exports.myCache = new NodeCache();
app.use(cookieParser());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://medhrplus.vercel.app",
      "https://mefhr.vercel.app",
      "https://medhr.netlify.app",
      "https://www.medhrplus.com",
      "https://medhrplus.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);

//Route imports
const user = require("./routes/empRoute.js");
const employeer = require("./routes/employeerRoute.js");
const job = require("./routes/jobsRoute.js");
const admin = require("./routes/adminRoute.js");
const skills = require("./routes/skillsRoute.js");
const videos = require("./routes/videoRoute.js");
const courses = require("./routes/coursesRoute.js");
const events = require("./routes/eventRoute.js");
const payment = require("./routes/paymentRoute.js");

app.use("/api/v1", user);
app.use("/api/v1", employeer);
app.use("/api/v1", job);
app.use("/api/v1", admin);
app.use("/api/v1", skills);
app.use("/api/v1", videos);
app.use("/api/v1", courses);
app.use("/api/v1", events);
app.use("/api/v1/payment", payment);

module.exports = app;

app.get("/", (req, res) => res.send(`<h1>Welcome to MedHR Plus</h1>`));

app.get("/api/v1/getkey", (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
);

//middleware
app.use(errorMiddleware);
