# EasyRead

Retro-modern PDF reader with a clean library, paging and scroll modes, vocabulary, and automatic text extraction. Built with MERN and optimized for Vercel and Render deployments.

## Live Demo

- Frontend: `https://easyread-1.onrender.com/`

## Features

- Upload PDFs with optional cover image; Cloudinary support for raw file storage.
- Fast reader with two modes:
  - Pages: book-style animation, exact viewport-fitting layout.
  - Scroll: continuous reading with theme controls.
- Reader customization: theme, palette, font size, line height, font, eye-comfort warmth/brightness.
- Word tools: dictionary meanings, translations, vocabulary save.
- Library: pin favorites, categories, cover thumbnails, last-page tracking.
- Highlights: select → color highlight → persists per book and user.
- Settings: per-user settings saved and reloaded automatically.
- Auth: simple email login/register (hashed) to sync data across devices.

## Tech Stack

- Frontend: React (Vite), React Router, Tailwind CSS, Axios.
- Backend: Node.js, Express, Helmet, CORS, Multer, Mongoose.
- Parsing: `pdf-parse` with text cleaning; client uses `pdfjs-dist` for fallback extraction when needed.
- External APIs: DictionaryAPI.dev, LibreTranslate.
- Deploy: Vercel (serverless for backend, static for frontend) or Render (backend).
- DB: MongoDB Atlas.

## Monorepo Layout

```
EasyRead/
├── server/
│   ├── api/index.js         # Serverless entry (Vercel)
│   ├── src/app.js           # Express app
│   ├── src/dev.js           # Local dev bootstrap
│   ├── src/routes/          # API routes (auth, books, upload, settings, highlights, vocab, meaning, translate)
│   ├── src/models/          # Mongoose models (Book, Page, Settings, User, Highlight, Vocab)
│   ├── src/services/pdf.js  # PDF text extraction + cleaning
│   └── vercel.json
└── client/
    ├── src/components/      # Reader, WordPopup, etc.
    ├── src/pages/           # Upload, Reader, Settings, Vocab
    ├── src/App.jsx          # Router and shell
    └── vite config and Tailwind config
```

## Backend API

- Auth
  - `POST /api/auth/register` → `{ userId, name, email }`
  - `POST /api/auth/login` → `{ userId, name, email }`
- Books
  - `GET /api/books?userId=` → list with `coverUrl`, `lastPage`, `pinned`
  - `GET /api/books/:id?userId=` → book details
  - `GET /api/books/:id/content?userId=` → `{ html, text }` (cached in `Page`)
  - `GET /api/books/:id/cover` → cover image (if present)
  - `GET /api/books/:id/file` → original PDF
  - `PATCH /api/books/:id` → update `{ title, category, lastPage, coverUrl, pinned, totalPages }`
  - `DELETE /api/books/:id?userId=` → delete book and pages
- Upload
  - `POST /api/upload` (multipart) fields: `pdf`, `cover` or `coverDataUrl` → `{ bookId, html, text, fileUrl, coverUrl, item }`
- Settings
  - `GET /api/settings?userId=` → per-user settings
  - `PATCH /api/settings` → upsert selected fields `{ font, theme, lineHeight, fontFamily, palette, eyeComfort, warmth, brightness }`
- Highlights
  - `GET /api/highlights?userId=&bookId=` → list
  - `POST /api/highlights` → create `{ text, color, nodeText, offset }`
  - `POST /api/highlights/remove` → delete by match
- Vocab
  - `GET /api/vocab?userId=` → list
  - `POST /api/vocab` → create `{ word, meaning, translation }`
- Tools
  - `GET /api/meaning/:word` → dictionary result
  - `GET /api/translate?text=&to=&from=` → translation result

## Environment Variables

Backend (`server/.env`)
- `MONGODB_URI` or `MONGO_URI` — MongoDB Atlas connection string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional for file storage
- `ALLOWED_ORIGINS` — comma-separated list for CORS (e.g. `https://easyreads.onrender.com/, http://localhost:5173`)
- `LIBRE_BASE_URL` — optional override for LibreTranslate base
- `PASSWORD_SALT` — optional salt for hashing

Frontend (`client/.env`)
- `VITE_API_URL` — API base, e.g. `http://localhost:5000/api` or `https://easyread-nxdy.onrender.com`

## Run Locally

Backend
- `cd server && npm install`
- Set `.env` as above
- `npm run dev` → `http://localhost:5000`

Frontend
- `cd client && npm install`
- Create `.env` with `VITE_API_URL=http://localhost:5000/api`
- `npm run dev` → `http://localhost:5173`

## Deployment

Render (Backend)
- Create a Web Service pointing to `server/`.
- Start command: `node src/dev.js` (or your preferred launcher).
- Set environment variables as above.
- Your API base will look like `https://<service>.onrender.com/api`.

Vercel
- Backend (Project root: `server/`):
  - Use serverless handler `server/api/index.js`.
  - Set the environment variables.
- Frontend (Project root: `client/`):
  - Build with `npm run build`, output `dist`.
  - Set `VITE_API_URL` to your backend `/api`.

## Reader UX Details

- Pages mode measures rendered content to fill the viewport exactly and animates page turns. It accounts for toolbars in fullscreen and avoids clipped lines with conservative measurement.
- Font changes reflow pages and keep your position by finding the closest matching text anchor or preserving relative progress.
- Scroll mode offers the same theme controls with continuous reading.

## Scripts

Frontend
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview locally

Backend
- `npm run dev` — start Express app locally

## License

MIT
