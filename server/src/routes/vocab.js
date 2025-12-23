const express = require("express");
const { Vocab } = require("../models/vocab");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId || userId === "guest") { res.status(401).json({ error: "requires_account" }); return; }
    const list = await Vocab.find({ userId }).sort({ _id: -1 }).limit(500).lean();
    res.json({ items: list });
  } catch (e) {
    res.status(500).json({ error: "vocab_list_failed" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, word, meaning, translation } = req.body;
    if (!userId || userId === "guest") { res.status(401).json({ error: "requires_account" }); return; }
    const v = await Vocab.create({ userId, word, meaning, translation });
    res.json({ id: v._id.toString() });
  } catch (e) {
    res.status(400).json({ error: "vocab_save_failed" });
  }
});

router.post("/migrate", async (req, res) => {
  try {
    const { toUserId } = req.body || {};
    if (!toUserId || toUserId === "guest") { res.status(400).json({ error: "invalid_target" }); return; }
    const r = await Vocab.updateMany({ userId: { $in: ["guest", null] } }, { $set: { userId: toUserId } });
    res.json({ moved: r.modifiedCount || 0 });
  } catch (e) {
    res.status(400).json({ error: "vocab_migrate_failed" });
  }
});

module.exports = router;