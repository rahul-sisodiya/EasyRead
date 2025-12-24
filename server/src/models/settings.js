const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  userId: { type: String, index: true, unique: true },
  font: { type: Number, default: 18 },
  theme: { type: String, default: "dark" },
  lineHeight: { type: Number, default: 1.6 },
  fontFamily: { type: String, default: "serif" },
  mode: { type: String, default: "page" },
  palette: { type: String, default: "black" },
  eyeComfort: { type: Boolean, default: false },
  warmth: { type: Number, default: 0.35 },
  brightness: { type: Number, default: 0.9 },
  panelImageDataUrl: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

module.exports = { Settings };
