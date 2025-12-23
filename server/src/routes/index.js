const express = require("express");
const uploadRouter = require("./upload");
const dictRouter = require("./meaning");
const translateRouter = require("./translate");
const vocabRouter = require("./vocab");
const booksRouter = require("./books");
const settingsRouter = require("./settings");
const highlightsRouter = require("./highlights");
const authRouter = require("./auth");

const router = express.Router();

router.use("/upload", uploadRouter);
router.use("/meaning", dictRouter);
router.use("/translate", translateRouter);
router.use("/vocab", vocabRouter);
router.use("/books", booksRouter);
router.use("/settings", settingsRouter);
router.use("/highlights", highlightsRouter);
router.use("/auth", authRouter);

module.exports = router;