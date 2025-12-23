const express = require("express");
require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const routes = require("./routes");

const app = express();
const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const corsOptions = allowed.length ? { origin: allowed, credentials: true } : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: "5mb" }));

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
if (mongoUri) {
  mongoose.connect(mongoUri).then(() => {
    console.log("MongoDB connected");
  }).catch(err => {
    console.error("MongoDB connection error", err && (err.message || err));
  });
  mongoose.connection.on("error", err => {
    console.error("MongoDB error", err && (err.message || err));
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.locals.upload = upload;
app.locals.cloudinary = cloudinary;

app.use("/api", routes);

app.use((err, req, res, next) => {
  try { console.error("unhandled_error", err?.message || err); } catch {}
  res.json({ error: "internal_server_error", path: String(req?.originalUrl || ""), detail: String(err?.message || err) });
});

module.exports = app;