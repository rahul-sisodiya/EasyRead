const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema({
  bookId: String,
  pageNumber: Number,
  text: String,
  html: String,
  createdAt: { type: Date, default: Date.now }
});

PageSchema.index({ bookId: 1, pageNumber: 1 }, { unique: true });

const Page = mongoose.models.Page || mongoose.model("Page", PageSchema);

module.exports = { Page };