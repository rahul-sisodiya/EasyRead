const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/:word", async (req, res) => {
  try {
    const r = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(req.params.word)}`);
    res.json(r.data);
  } catch (e) {
    res.status(404).json({ error: "not_found" });
  }
});

module.exports = router;