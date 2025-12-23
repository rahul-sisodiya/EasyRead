const express = require("express");
const crypto = require("crypto");
const { User } = require("../models/user");

const router = express.Router();

function hashPassword(pw) {
  const salt = process.env.PASSWORD_SALT || "easyread_salt";
  return crypto.createHash("sha256").update(String(pw) + ":" + salt).digest("hex");
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) { res.status(400).json({ error: "missing_fields" }); return; }
    const existing = await User.findOne({ email }).lean();
    if (existing) { res.status(409).json({ error: "already_exists" }); return; }
    const passwordHash = hashPassword(password);
    const u = await User.create({ name: name || "", email, passwordHash });
    res.json({ userId: u.email, name: u.name || "", email: u.email });
  } catch (e) {
    res.status(400).json({ error: "register_failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) { res.status(400).json({ error: "missing_fields" }); return; }
    const u = await User.findOne({ email }).lean();
    if (!u) { res.status(401).json({ error: "invalid_credentials" }); return; }
    const passwordHash = hashPassword(password);
    if (u.passwordHash !== passwordHash) { res.status(401).json({ error: "invalid_credentials" }); return; }
    res.json({ userId: u.email, name: u.name || "", email: u.email });
  } catch (e) {
    res.status(400).json({ error: "login_failed" });
  }
});

module.exports = router;