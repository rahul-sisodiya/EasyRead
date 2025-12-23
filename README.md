# EasyRead (MERN, Vercel-ready)

## Overview

- Upload PDF, extract text (OCR fallback), clean paragraphs, and paginate for a book-like reading experience.
- Select any word to get meaning, translation, pronunciation, and save to vocabulary.
- Reader features: font size, themes, bookmarks, reading progress.

## Stack

- Frontend: React, Vite, Tailwind, React Router, Axios
- Backend: Node.js, Express, Multer, pdf-parse, Mongoose, Cloudinary
- Services: DictionaryAPI.dev, LibreTranslate
- Deploy: Vercel (frontend and backend as separate projects)
- DB: MongoDB Atlas

## Folder Structure

```
project/
├── server/
│   ├── api/index.js           # Vercel serverless function entry
│   ├── src/app.js             # Express app (exported)
│   ├── src/dev.js             # Local dev server (listens)
│   ├── src/routes/            # upload, meaning, translate, vocab
│   ├── src/models/            # Book, Page, Vocab
│   ├── src/services/pdf.js    # pdf parse + cleaning
│   └── vercel.json
└── client/
    ├── src/components/        # Reader, WordPopup
    ├── src/pages/             # Upload, Reader, Settings, Vocab
    ├── src/App.jsx, main.jsx
    ├── tailwind.config.js
    └── vite.config.js
```

## How It Works

- Upload: Client posts `multipart/form-data` to backend `/api/upload` using Multer. File is stored in temp, optionally uploaded to Cloudinary (raw resource).
- Parse: Backend reads PDF using `pdf-parse`, returns raw text. If text is empty, you can later enable OCR via `tesseract.js` over rendered page images.
- Clean: Text is normalized and wrapped in `<p>` elements for paragraph-preserving layout.
- Paginate: Client measures rendered content and splits into pages based on available vertical space.
- Word actions: Selection triggers backend proxies:
  - Meaning: `GET /api/meaning/:word` → DictionaryAPI.dev
  - Translation: `GET /api/translate?text=&to=` → LibreTranslate
  - Save: `POST /api/vocab` persists word + metadata in MongoDB
- Reader state: Font size, theme, current page, bookmarks saved in `localStorage`.

## Run Locally

1) Backend

- `cd server`
- `npm install`
- Set `.env` (locally) with:
  - `MONGODB_URI` (MongoDB Atlas connection string)
  - Optional Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `npm run dev`
- Server runs at `http://localhost:5000`

2) Frontend

- `cd client`
- `npm install`
- Create `.env` with `VITE_API_URL=http://localhost:5000/api`
- `npm run dev`
- App runs at `http://localhost:5173`

## Deploy on Vercel

You will create two Vercel projects from this monorepo.

1) Backend (Project Root: `server`)

- Framework preset: Other
- Build command: NONE (serverless functions)
- Output directory: Leave empty
- Environment variables:
  - `MONGODB_URI`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optional)
- After deploy, note the backend URL, e.g. `https://easyread-server.vercel.app`

2) Frontend (Project Root: `client`)

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_URL=https://easyread-server.vercel.app/api`

## Key Files

- Backend app export: `server/src/app.js`
- Vercel function entry: `server/api/index.js`
- Upload route: `server/src/routes/upload.js`
- PDF service: `server/src/services/pdf.js`
- Meaning proxy: `server/src/routes/meaning.js`
- Translate proxy: `server/src/routes/translate.js`
- Vocabulary route: `server/src/routes/vocab.js`
- Reader component: `client/src/components/Reader.jsx`
- Word popup: `client/src/components/WordPopup.jsx`
- Settings page: `client/src/pages/SettingsPage.jsx`

## API Summary

- `POST /api/upload` → returns `{ bookId, html, text }`
- `GET /api/meaning/:word` → returns dictionary entries or 404
- `GET /api/translate?text=<>&to=<lang>` → returns translation payload
- `POST /api/vocab` → saves vocabulary item

## Notes

- Dictionary queries for unknown words return a standardized error (no definitions found). The client handles missing data gracefully.
- Use POST for LibreTranslate; GET may be rejected with 405 if not supported.
- For OCR: integrate `pdfjs-dist` to render page canvases and pass images into `tesseract.js` when `pdf-parse` yields empty text.