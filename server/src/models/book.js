const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  userId: String,
  title: String,
  fileUrl: String,
  fileData: Buffer,
  coverUrl: String,
  coverType: String,
  coverData: Buffer,
  hasCover: { type: Boolean, default: false },
  category: { type: String, default: "Uncategorized" },
  lastPage: { type: Number, default: 0 },
  totalPages: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Book = mongoose.models.Book || mongoose.model("Book", BookSchema);

module.exports = { Book };
