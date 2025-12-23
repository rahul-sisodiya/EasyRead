const mongoose = require("mongoose");

const HighlightSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  bookId: { type: String, index: true },
  page: { type: Number, default: 0 },
  text: String,
  color: { type: String, default: "yellow" },
  nodeText: String,
  offset: Number,
  ts: { type: Date, default: Date.now }
});

const Highlight = mongoose.models.Highlight || mongoose.model("Highlight", HighlightSchema);

module.exports = { Highlight };