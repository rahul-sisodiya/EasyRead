const express = require("express");
const { Book } = require("../models/book");
const { Page } = require("../models/page");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId || userId === "guest") { res.status(401).json({ error: "requires_account" }); return; }
    const itemsRaw = await Book.find({ userId }, { hasCover: 1, title: 1, category: 1, createdAt: 1, lastPage: 1, totalPages: 1, pinned: 1, fileUrl: 1, coverUrl: 1 }).sort({ createdAt: -1 }).lean();
    const items = itemsRaw.map(it => ({ ...it, coverUrl: ((it.hasCover || it.coverUrl) ? (it.coverUrl || `/api/books/${it._id}/cover`) : "") }));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: "books_list_failed" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId || userId === "guest") {
      const b0 = await Book.findById(req.params.id, { hasCover: 1, title: 1, category: 1, createdAt: 1, lastPage: 1, totalPages: 1, pinned: 1, fileUrl: 1, coverUrl: 1 }).lean();
      if (!b0) { res.status(404).json({ error: "not_found" }); return; }
      const item0 = { ...b0, coverUrl: ((b0.hasCover || b0.coverUrl) ? (b0.coverUrl || `/api/books/${b0._id}/cover`) : "") };
      res.json({ item: item0 });
      return;
    }
    const b = await Book.findOne({ _id: req.params.id, userId }, { hasCover: 1, title: 1, category: 1, createdAt: 1, lastPage: 1, totalPages: 1, pinned: 1, fileUrl: 1, coverUrl: 1 }).lean();
    if (!b) {
      const bAny = await Book.findById(req.params.id, { hasCover: 1, title: 1, category: 1, createdAt: 1, lastPage: 1, totalPages: 1, pinned: 1, fileUrl: 1, coverUrl: 1 }).lean();
      if (!bAny) { res.status(404).json({ error: "not_found" }); return; }
      const item = { ...bAny, coverUrl: ((bAny.hasCover || bAny.coverUrl) ? (bAny.coverUrl || `/api/books/${bAny._id}/cover`) : "") };
      res.json({ item });
      return;
    }
    const item = { ...b, coverUrl: ((b.hasCover || b.coverUrl) ? (b.coverUrl || `/api/books/${b._id}/cover`) : "") };
    res.json({ item });
  } catch (e) {
    res.status(400).json({ error: "books_get_failed" });
  }
});

router.get("/:id/content", async (req, res) => {
  try {
    const userId = req.query.userId;
    let b = null;
    if (!userId || userId === "guest") {
      b = await Book.findById(req.params.id).lean();
    } else {
      b = await Book.findOne({ _id: req.params.id, userId }).lean();
      if (!b) b = await Book.findById(req.params.id).lean();
    }
    if (!b) { res.status(404).json({ error: "not_found" }); return; }
    const { Page } = require("../models/page");
    let p = await Page.findOne({ bookId: req.params.id, pageNumber: -1 }).lean();
    if (!p) {
      try {
        if (b.fileUrl || b.fileData) {
          const axios = require("axios");
          const { processPdf } = require("../services/pdf");
          let buf = null;
          if (b.fileData && Buffer.isBuffer(b.fileData) && b.fileData.length) {
            buf = b.fileData;
          } else if (b.fileUrl) {
            const rr = await axios.get(b.fileUrl, { responseType: "arraybuffer" });
            buf = Buffer.from(rr.data);
          }
          const r = await processPdf(null, buf);
          let html = String(r?.html || "");
          let text = String(r?.text || "");
          try {
            const plain = String(html || "").replace(/<[^>]+>/g, "").trim();
            if (!plain) {
              if (String(text || "").trim()) {
                const lines = String(text).replace(/\r/g, "\n").split(/\n+/).map(s => s.trim()).filter(Boolean);
                html = `<p>` + lines.join(`</p><p>`) + `</p>`;
              } else {
                html = `<p>No extractable text in this PDF.</p>`;
              }
            }
          } catch {}
          const { Page } = require("../models/page");
          await Page.create({ bookId: req.params.id, pageNumber: -1, html, text });
          p = { html, text };
        }
      } catch {}
    }
    if (!p) { res.status(404).json({ error: "content_not_found" }); return; }
    let plain = String(p.html || "").replace(/<[^>]+>/g, "").trim();
    let htmlOut = String(p.html || "");
    if (!plain && (b.fileData || b.fileUrl)) {
      try {
        const { processPdf } = require("../services/pdf");
        let buf = null;
        if (b.fileData && Buffer.isBuffer(b.fileData) && b.fileData.length) buf = b.fileData;
        else if (b.fileUrl) {
          const axios = require("axios");
          const rr = await axios.get(b.fileUrl, { responseType: "arraybuffer" });
          buf = Buffer.from(rr.data);
        }
        const r = await processPdf(null, buf);
        htmlOut = String(r?.html || "");
        const tt = String(r?.text || "");
        const pl = htmlOut.replace(/<[^>]+>/g, "").trim();
        if (!pl) htmlOut = (tt.trim() ? (`<p>` + tt.replace(/\r/g, "\n").split(/\n+/).map(s => s.trim()).filter(Boolean).join(`</p><p>`) + `</p>`) : `<p>No extractable text in this PDF.</p>`);
        try { await Page.updateOne({ bookId: req.params.id, pageNumber: -1 }, { $set: { html: htmlOut, text: tt } }, { upsert: true }); } catch {}
      } catch {}
    } else if (!plain) {
      const tt = String(p.text || "");
      htmlOut = (tt.trim() ? (`<p>` + tt.replace(/\r/g, "\n").split(/\n+/).map(s => s.trim()).filter(Boolean).join(`</p><p>`) + `</p>`) : `<p>No extractable text in this PDF.</p>`);
    }
    try { console.log("books_content", { id: req.params.id, plainLen: plain.length, ttLen: String(p.text||"").length, htmlLen: htmlOut.length }); } catch {}
    res.json({ html: htmlOut, text: p.text || "" });
  } catch (e) {
    res.status(400).json({ error: "books_content_failed" });
  }
});

router.get("/:id/cover", async (req, res) => {
  try {
    const b = await Book.findById(req.params.id).lean();
    if (!b || !b.coverData) { res.status(404).json({ error: "cover_not_found" }); return; }
    const type = b.coverType || "image/jpeg";
    res.set("Content-Type", type);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(Buffer.from(b.coverData));
  } catch (e) {
    res.status(400).json({ error: "books_cover_failed" });
  }
});

router.get("/:id/file", async (req, res) => {
  try {
    const b = await Book.findById(req.params.id, { fileData: 1, fileUrl: 1 }).lean();
    res.set("Content-Type", "application/pdf");
    res.set("Cache-Control", "private, max-age=3600");
    if (b?.fileData && Buffer.isBuffer(b.fileData) && b.fileData.length) {
      res.send(Buffer.from(b.fileData));
      return;
    }
    if (b?.fileUrl) {
      try {
        const axios = require("axios");
        const rr = await axios.get(b.fileUrl, { responseType: "arraybuffer" });
        res.send(Buffer.from(rr.data));
        return;
      } catch {}
    }
    res.status(404).json({ error: "file_not_found" });
  } catch (e) {
    res.status(400).json({ error: "books_file_failed" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId;
    if (!userId || userId === "guest") { res.status(401).json({ error: "requires_account" }); return; }
    const { title, category, lastPage, totalPages, coverUrl, pinned, coverDataUrl } = req.body || {};
    const update = {};
    if (typeof title === "string") update.title = title;
    if (typeof category === "string") update.category = category;
    if (Number.isFinite(Number(lastPage))) update.lastPage = Number(lastPage);
    if (typeof coverUrl === "string") update.coverUrl = coverUrl;
    if (typeof pinned === "boolean") update.pinned = pinned;
    if (typeof coverDataUrl === "string" && coverDataUrl.startsWith("data:")) {
      const m = coverDataUrl.match(/^data:(.+?);base64,(.*)$/);
      if (m) {
        const mimetype = m[1];
        const b64 = m[2];
        try {
          const buf = Buffer.from(b64, "base64");
          update.coverType = mimetype;
          update.coverData = buf;
          update.hasCover = true;
          update.coverUrl = `/api/books/${req.params.id}/cover`;
        } catch {}
      }
    }
    if (Number.isFinite(Number(totalPages))) update.totalPages = Math.max(0, Number(totalPages));
    await Book.updateOne({ _id: req.params.id, userId }, { $set: update });
    res.json({ ok: true, coverPersisted: !!update.hasCover });
  } catch (e) {
    res.status(400).json({ error: "books_update_failed" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId || userId === "guest") { res.status(401).json({ error: "requires_account" }); return; }
    const b = await Book.findOne({ _id: req.params.id, userId }).lean();
    if (!b) { res.status(404).json({ error: "not_found" }); return; }
    await Book.deleteOne({ _id: req.params.id, userId });
    try { await Page.deleteMany({ bookId: req.params.id }); } catch {}
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "books_delete_failed" });
  }
});

router.post("/migrate", async (req, res) => {
  try {
    const { toUserId } = req.body || {};
    if (!toUserId || toUserId === "guest") { res.status(400).json({ error: "invalid_target" }); return; }
    const q = { $or: [ { userId: "guest" }, { userId: null }, { userId: { $exists: false } } ] };
    const r = await Book.updateMany(q, { $set: { userId: toUserId } });
    res.json({ moved: r.modifiedCount || 0 });
  } catch (e) {
    res.status(400).json({ error: "books_migrate_failed" });
  }
});

module.exports = router;
