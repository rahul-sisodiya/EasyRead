const mongoose = require("mongoose");

const VocabSchema = new mongoose.Schema({
  userId: String,
  word: String,
  meaning: Object,
  translation: Object
});

const Vocab = mongoose.models.Vocab || mongoose.model("Vocab", VocabSchema);

module.exports = { Vocab };