const express = require("express");
const mongoose = require("mongoose");
const { processPdf } = require("../services/pdf");
const { Book } = require("../models/book");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const upload = req.app.locals.upload;
    const handle = upload.fields([
      { name: "pdf", maxCount: 1 },
      { name: "cover", maxCount: 1 }
    ]);
    handle(req, res, async err => {
      try {
        try { console.log("upload_start", { url: req.originalUrl, hasFile: !!req.file }); } catch {}
        if (err) {
          res.status(200).json({ error: "upload_failed", detail: String(err?.message || err), bookId: null, html: "", text: "", fileUrl: "", coverUrl: "" });
          return;
        }
        const uid = req.body?.userId || req.query?.userId;
        if (!uid || uid === "guest") {
          res.status(200).json({ error: "requires_account", bookId: null, html: "", text: "", fileUrl: "", coverUrl: "" });
          return;
        }
        const pdfFile = (req.files && Array.isArray(req.files.pdf) ? req.files.pdf[0] : null) || req.file || null;
        let coverFile = null;
        const coverDataUrl = req.body?.coverDataUrl;
        try { console.log("cover_field", { present: !!coverDataUrl, length: (coverDataUrl || "").length }); } catch {}
        const coverUpload = (req.files && Array.isArray(req.files.cover) ? req.files.cover[0] : null);
        if (coverUpload && coverUpload.buffer && coverUpload.buffer.length > 0) {
          coverFile = { fieldname: "cover", originalname: coverUpload.originalname || "cover", mimetype: coverUpload.mimetype || "image/jpeg", buffer: coverUpload.buffer };
          try { console.log("cover_file", { type: coverUpload.mimetype, size: coverUpload.buffer.length, via: "file" }); } catch {}
        }
        if (typeof req.body?.coverDataUrl === "string" && req.body.coverDataUrl.startsWith("data:")) {
          const m = req.body.coverDataUrl.match(/^data:(.+?);base64,(.*)$/);
          if (m) {
            const mimetype = m[1];
            const b64 = m[2];
            try {
              const buf = Buffer.from(b64, "base64");
              coverFile = { fieldname: "cover", originalname: "cover", mimetype, buffer: buf };
              try { console.log("cover_file", { type: mimetype, size: buf.length }); } catch {}
            } catch {}
          }
        }
        if (!pdfFile) {
          res.status(200).json({ error: "no_file", bookId: null, html: "", text: "", fileUrl: "", coverUrl: "" });
          return;
        }
        const filePath = pdfFile.path || "";
        const buffer = pdfFile.buffer;
        if (!buffer && !filePath) {
          res.status(200).json({ error: "no_file_data", bookId: null, html: "", text: "", fileUrl: "", coverUrl: "" });
          return;
        }
        let fileUrl = "";
        let coverUrl = "";
        let html = ""; let text = "";
        try {
          const r = await processPdf(filePath, buffer);
          html = r?.html || "";
          text = r?.text || "";
        } catch (e3) {
          html = ""; text = "";
        }
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
        try {
          const cl = req.app.locals.cloudinary;
          if (cl && buffer && buffer.length) {
            const dataUri = `data:application/pdf;base64,${Buffer.from(buffer).toString("base64")}`;
            const up = await cl.uploader.upload(dataUri, { resource_type: "raw", folder: "easyread", overwrite: false });
            fileUrl = String(up?.secure_url || up?.url || "");
          }
        } catch {}
        const dbReady = (mongoose.connection && mongoose.connection.readyState === 1);
        let bookId = null;
        if (dbReady) {
          const doc = {
            userId: uid,
            title: req.body?.title || "Untitled",
            fileUrl,
            fileData: buffer,
            coverUrl: "",
            coverType: coverFile?.mimetype || undefined,
            coverData: coverFile?.buffer || undefined,
            hasCover: !!(coverFile && coverFile.buffer && coverFile.buffer.length > 0),
            category: req.body?.category || "Uncategorized"
          };
          const book = await Book.create(doc);
          bookId = book._id.toString();
          if (doc.hasCover) {
            coverUrl = `/api/books/${bookId}/cover`;
            await Book.updateOne({ _id: bookId }, { $set: { coverUrl, hasCover: true } });
            try { console.log("cover_saved", { bookId, coverUrl }); } catch {}
          }
        try { await require("../models/page").Page.create({ bookId, pageNumber: -1, text, html }); } catch {}
        }
        let item = null;
        try {
          if (bookId) {
            const b = await Book.findById(bookId, { coverData: 1, title: 1, category: 1, createdAt: 1, lastPage: 1, pinned: 1, fileUrl: 1, coverUrl: 1 }).lean();
            if (b) { item = { ...b, _id: b._id.toString(), hasCover: !!b.coverData, coverUrl: (b.coverData ? b.coverUrl : "") }; delete item.coverData; }
          }
        } catch {}
        try { console.log("upload_ok", { bookId, textLen: (text || "").length, htmlLen: (html || "").length }); } catch {}
        res.status(200).json({ bookId, html, text, fileUrl, coverUrl, item });
      } catch (e2) {
        console.error("upload_processing_error", e2?.message || e2);
        res.status(200).json({ bookId: null, html: "", text: "", fileUrl: "", coverUrl: "" });
      }
    });
  } catch (e) {
    console.error("upload_route_error", e?.message || e);
    res.status(200).json({ bookId: null, html: "", text: "", fileUrl: "", coverUrl: "" });
  }
});

module.exports = router;
