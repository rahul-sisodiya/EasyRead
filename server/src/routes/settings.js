const express = require("express");
const { Settings } = require("../models/settings");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId || userId === "guest") { res.status(401).json({ error: "requires_account" }); return; }
    const s = await Settings.findOne({ userId }).lean();
    if (!s) {
      res.json({ item: { userId, font: 18, theme: "dark", lineHeight: 1.6, fontFamily: "serif", palette: "black", eyeComfort: false, warmth: 0.35, brightness: 0.9, panelImageDataUrl: "" } });
      return;
    }
    res.json({ item: s });
  } catch (e) {
    res.status(500).json({ error: "settings_get_failed" });
  }
});

router.patch("/", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) { res.status(400).json({ error: "no_user" }); return; }
    const update = {};
    const pick = ["font","theme","lineHeight","fontFamily","palette","eyeComfort","warmth","brightness","panelImageDataUrl"];
    pick.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedAt = new Date();
    await Settings.updateOne({ userId }, { $set: update }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "settings_update_failed" });
  }
});

module.exports = router;
