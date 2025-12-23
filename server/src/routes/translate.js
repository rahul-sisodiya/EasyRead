const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { text, to, from } = req.query;
    const body = { q: text, source: (from || "en").toLowerCase(), target: (to || "en").toLowerCase(), format: "text" };
    const base = process.env.LIBRE_BASE_URL || "https://libretranslate.com";
    const urls = [
      `${base}/translate`,
      "https://libretranslate.de/translate",
      "https://translate.astian.org/translate",
      "https://translate.argosopentech.com/translate",
    ];
    const headers = { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": "EasyRead/1.0" };
    const calls = urls.map(u => axios.post(u, body, { headers, timeout: 6000 }));
    let payload = null;
    try {
      const r = await Promise.any(calls);
      payload = r?.data || null;
    } catch (err) {
      payload = null;
    }
    if (!payload) {
      res.status(502).json({ error: "translate_unavailable" });
      return;
    }
    let t = "";
    if (typeof payload === "string") t = payload;
    else if (payload.translatedText) t = payload.translatedText;
    else if (payload.translation) t = payload.translation;
    else if (Array.isArray(payload.translations) && payload.translations[0]?.text) t = payload.translations[0].text;
    if (!t) {
      res.status(502).json({ error: "translate_unavailable" });
      return;
    }
    res.json({ translatedText: t });
  } catch (e) {
    res.status(500).json({ error: "translate_failed" });
  }
});

module.exports = router;