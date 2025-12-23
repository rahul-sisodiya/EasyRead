const express = require("express");
const { Highlight } = require("../models/highlight");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId, bookId } = req.query || {};
    if (!userId || userId === "guest" || !bookId) { res.status(401).json({ error: "requires_account" }); return; }
    const items = await Highlight.find({ userId, bookId }).sort({ ts: -1 }).lean();
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: "highlights_list_failed" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, bookId, page, text, color, nodeText, offset } = req.body || {};
    if (!userId || userId === "guest" || !bookId || !text) { res.status(401).json({ error: "requires_account" }); return; }
    const h = new Highlight({ userId, bookId, page: Number(page || 0), text, color, nodeText, offset: Number(offset || 0) });
    await h.save();
    res.json({ ok: true, id: h._id });
  } catch (e) {
    res.status(400).json({ error: "highlights_create_failed" });
  }
});

router.post("/remove", async (req, res) => {
  try {
    const { userId, bookId, page, text, nodeText, offset } = req.body || {};
    if (!userId || userId === "guest" || !bookId) { res.status(401).json({ error: "requires_account" }); return; }
    const q = { userId, bookId };
    if (text) q.text = text;
    if (nodeText) q.nodeText = nodeText;
    if (offset !== undefined) q.offset = Number(offset);
    if (page !== undefined) q.page = Number(page);
    await Highlight.deleteMany(q);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "highlights_remove_failed" });
  }
});

router.post("/migrate", async (req, res) => {
  try {
    const { toUserId } = req.body || {};
    if (!toUserId || toUserId === "guest") { res.status(400).json({ error: "invalid_target" }); return; }
    const r = await Highlight.updateMany({ userId: { $in: ["guest", null] } }, { $set: { userId: toUserId } });
    res.json({ moved: r.modifiedCount || 0 });
  } catch (e) {
    res.status(400).json({ error: "highlights_migrate_failed" });
  }
});

module.exports = router;