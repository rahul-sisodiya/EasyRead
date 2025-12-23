const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, index: true, unique: true },
  name: String,
  passwordHash: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = { User };