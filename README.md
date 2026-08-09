# EasyReads v2 — Spring Boot + React

A cinematic, retro-modern PDF reader with a clean library, paging and scroll modes, vocabulary builder, highlights, and automatic text extraction. **v2** is a full backend migration from Express/MongoDB to a Spring Boot 3 + MySQL architecture, keeping the React frontend intact for 1:1 API compatibility.

---

## Features

- Upload PDFs with optional cover image (stored directly in the database as BLOB / Base64 DataURL).
- Two reading modes:
  - **Pages**: book-style flip animation, viewport-fitting layout with precise page measurement.
  - **Scroll**: continuous reading with the same theme controls.
- Reader customization: theme, palette, font size, line height, font family, eye-comfort warmth & brightness sliders, decorative panel image.
- Word tools: dictionary meanings (DictionaryAPI.dev), translations (LibreTranslate + MyMemory fallback), vocabulary save.
- Library: pin favorites, categories, cover thumbnails, last-page + last-scroll tracking per book.
- Highlights: select text → color highlight → persisted per user and book with positional offset restoration.
- Settings: per-user reader settings saved to the database and reloaded automatically on login.
- Auth: email/password register/login with BCrypt password hashing to sync data across devices.

---

## Tech Stack

| Layer       | Technology |
|-------------|----------|
| **Frontend** | React 18 (Vite 5), React Router 6, Tailwind CSS 3, Axios, DOMPurify, pdfjs-dist (fallback extraction) |
| **Backend**  | Spring Boot 3.2.5, Spring Web, Spring Data JPA, Hibernate Validator, Spring Security Crypto (BCrypt) |
| **Database** | MySQL 8+ (Aiven Cloud with SSL), JPA entities with `@Lob` for PDF BLOB/LONGTEXT |
| **PDF I/O  | Apache PDFBox 3.0.2 (server-side text extraction), custom `sortByPosition=true`) |
| **External APIs | DictionaryAPI.dev (meanings), LibreTranslate (multi-mirror fallback) + MyMemory (translation fallback) |
| **Build**    | Maven (backend), Vite (frontend) |
| **Dev Proxy  | Vite dev server proxies `/api` → `http://localhost:8080` |

---

## Monorepo Layout

```
EasyReads/
├── backend/                              # Spring Boot 3.2.5 (Java 17+)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/easyreads/
│       │   ├── EasyReadsApplication.java        # Main class
│       │   ├── config/
│       │   │   └── CorsConfig.java       # Global CORS (allowedOrigins env-driven
│       │   ├── controller/              # REST endpoints
│       │   │   ├── AuthController.java   # /api/auth/{register,login}
│       │   │   ├── BookController.java   # /api/books + /api/upload
│       │   │   ├── HighlightController.java
│       │   │   ├── SettingsController.java
│       │   │   ├── UtilsController.java      # /api/meaning + /api/translate
│       │   │   └── VocabController.java
│       │   ├── dto/
│       │   │   ├── ApiResponse.java      # Shared DTO (matches original Node.js response shape
│       │   │   ├── AuthRequest.java
│       │   │   └── UpdateRequest.java
│       │   ├── entity/               # JPA entities
│       │   │   ├── Book.java            # + PdfService.java
│       │   │   ├── SettingsService.java
│       │   │   └── VocabService.java
│       │   ├── repository/            # Spring Data JPA repositories
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.java
│       │   │   └── ResourceNotFoundException.java
│       │   └── util/
│       │       └── TextParser.java    # clean() + toHtml() text pipeline
│       └── resources/
│           └── application.properties   # DB via env vars, 100MB multipart, ddl-auto=update
│
├── frontend/                            # React 18 + Vite
│   ├── vite.config.js                 # /api proxy to :8080
│   ├── package.json
│   ├── index.html
│   ├── tailwind.config.js
│   ├── public/
│   └── src/
│       ├── components/               # Reader, WordPopup, Logo, UserBadge
│       ├── pages/                  # Landing, Upload, Reader, Vocab, Settings, SignIn, Register
│       ├── App.jsx
│       ├── main.jsx
│       ├── App.css
│       ├── index.css
│       └── styles.css
│
├── .gitignore                         # Root-level ignores target/, node_modules/, extracted/, *.pdf
└── README.md
```

---

## Architecture

The backend follows a clean, beginner-friendly **Controller → Service → Repository → Entity** layered architecture:

```
HTTP Request
    │
    ▼
┌───────────────────┐
│  Controller     │  Validates input, delegates to Service, shapes HTTP
│  (thin)      returns ResponseEntity<ApiResponse>
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    Service        │  Business logic lives here (not in controllers)
│   (fat)            │  - PdfService validates PDFs + extracts via PDFBox
│                   │  - AuthService uses BCryptPasswordEncoder
│                   │  - Ownership checks throw IllegalArgumentException
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Repository    │  Spring Data JPA: findBy..., existsBy...
│  (interface)     │  BookRepository, UserRepository, etc.
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     Entity        │  JPA-annotated POJOs
│    (@Entity)      │  @PrePersist / @PreUpdate defaults
└───────────────────┘
          │
          ▼
      MySQL DB
```

Key design decisions:
- **Secrets via env vars (never hard-code `DB_PASSWORD`)
- DTO field names in `ApiResponse.java` mirrors the original Node.js response shape → frontend needs zero rework
- PDFs stored in the database **directly inside MySQL `@Lob LONGBLOB columns (no filesystem/cloud storage needed)
- `spring.jpa.hibernate.ddl-auto=update` for development schema management
- REST resource ownership checks: delete ops throw `IllegalArgumentException` for unauthorized attempts are explicit with explicit exceptions raised explicitly

---

## Database Schema

### `users` table
| Column       | Type         | Constraints         |
|------------|--------------|-------------------|
| id         | BIGINT       | PK, AUTO_INCREMENT |
| name       | VARCHAR      | NOT NULL          |
| email      | VARCHAR      | UNIQUE, NOT NULL   |
| password   | VARCHAR      | NOT NULL (BCrypt hash) |
| created_at | DATETIME     | NOT NULL          |

### `books` table
| Column          | Type         | Notes                              |
|-----------------|--------------|----------------------------------|
| id              | BIGINT       | PK                               |
| user_id         | VARCHAR      | FK → users                       |
| title, author, author  | VARCHAR      |                                  |
| category       | LONGTEXT     | Cleaned text, nullable         |
| html_content    | LONGTEXT     | HTML-renderable paragraphs     |
| file_data       | LONGBLOB     | Original PDF bytes               |
| cover_image     | LONGTEXT     | Base64 DataURL            |
| pinned          | INT       | Default 0                     |
| total_pages     | INT          |                                  |
| last_mode     | VARCHAR    | page/scroll last position    |
| created_at      | DATETIME     | NOT NULL          |

### `highlights` table
| Column        | Type      |
|---------------|-----------|
| id, user_id, book_id | BIGINT/VARCHAR |
| page          | INT       |
| text          | TEXT    |
| color       | VARCHAR   |
| node_text     | VARCHAR(2000) |
| offset_value  | INT       |
| created_at    | DATETIME  |

### `vocab` table
| Column              | Type         |
|-------------------|--------------|
| id, user_id       | BIGINT/VARCHAR |
| word              | VARCHAR      |
| meaning_data      | LONGTEXT (JSON) |
| translation_data  | LONGTEXT       |
| created_at        | DATETIME       |

### `settings` table (1:1 user_id)
| Column      | Type         | Defaults |
|-----------|--------------|--------|
| font (px), lineHeight, warmth, brightness, brightness 0.9 |  mode "page", palette "black"
| panel_image_data_url | LONGTEXT | custom SVG/texture DataURL |
| created_at / updated_at | DATETIME |

---

## Backend API (frontend compatibility)

All endpoints return shapes matching the original v1 Node.js contract exactly (`ApiResponse DTO).

### Auth
| Method | Endpoint               | Body / Params              | Returns                         |
|--------|------------------------|--------------------------|-------------------------------|
| POST   | `/api/auth/register`  | `{ name, email, password }` | `{ userId, name, email }` |
| POST   | `/api/auth/login`     | `{ email, password }`     | `{ userId, name, email }`     |

### Books & Upload
| Method | Endpoint                        | Notes                                                    |
|--------|---------------------------------|--------------------------------------------------------|
| POST   | `/api/upload` (multipart)   | fields: `pdf`, `title?`, `category?`, `userId?`, `coverDataUrl?` → `{ bookId, message }` |
| GET    | `/api/books?userId=`       | List with `coverUrl`, `lastPage`, `pinned`, `totalPages` |
| GET    | `/api/books/:id?userId=`    | Single book object                       |
| GET    | `/api/books/:id/content?userId=` | `{ html, text }` content (was cached directly on upload  |
| GET    | `/api/books/:id/file`         | `Content-Type: application/pdf` download (byte stream |
| GET    | `/api/books/:id/cover`     | JPEG/PNG/GIF image bytes decoded from cover DataURL         |
| PATCH  | `/api/books/:id`           | Update fields: title/category/lastPage/pinned/totalPages/lastMode/coverUrl/lastScroll |
| DELETE | `/api/books/:id?userId=`    | Ownership check; throws IllegalArgumentException if wrong user |

### Settings
| Method | Endpoint                 | Body                     |
|--------|--------------------------|--------------------------|
| GET    | `/api/settings?userId=` | Per-user settings object |
| PATCH  | `/api/settings`        | Upsert by userId +selected fields |

### Highlights
| Method | Endpoint                           | Body / Params |
|--------|------------------------------------|-------------|
| GET    | `/api/highlights?userId=&bookId=`  | List        |
| POST   | `/api/highlights`                | `{ userId, bookId, page, text, color,  |
| POST   | `/api/highlights/remove`         | Delete by exact match |

### Vocab
| Method | Endpoint             | Body / Params |
|--------|----------------------|-------------|
| GET    | `/api/vocab?userId=` | List       |
| POST   | `/api/vocab`        | `{ word, meaning, translation, userId }` |
| DELETE | `/api/vocab/:id?userId=` | Delete |

### Utils (external integrations)
| Method | Endpoint                                              | Behavior |
|--------|-------------------------------------------------------|----------|
| GET    | `/api/meaning/:word`                                   | DictionaryAPI.dev proxy, `[]` on error |
| GET    | `/api/translate?text=&to=&from=` (default en→hi)         | 4 LibreTranslate mirrors → MyMemory fallback |

---

## Environment Variables

Backend (Spring Boot `application.properties` reads these with sensible defaults:

| Variable      | Default (dev example)                                    | Required |
|---------------|--------------------------------------------------------|----------|
| `DB_HOST`     | `easyread-xxx.aivencloud.com`                         | ✅        |
| `DB_PORT`     | `20325`                                                | ✅        |
| `DB_NAME`     | `defaultdb`                                            | ✅        |
| `DB_USERNAME` | `avnadmin`                                           | ✅        |
| `DB_PASSWORD` | *(none — set this!)*                                    | ✅ NEVER commit this value |

Frontend (`vite.config.js defines `import.meta.env.VITE_API_URL` = `"/api"` (no frontend `.env` needed in dev thanks to proxy) optional for production deploy:
| Variable              | Purpose                     |
|-----------------------|---------------------------|
| `VITE_API_URL`        | Production backend base URL, e.g. `https://<deployed-host/api` |

---

## Run Locally

### Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 18+
- MySQL 8+ instance (or Aiven Cloud)

### Backend (Port 8080)
```bash
# Set env vars (PowerShell)
$env:DB_HOST="your-host"
$env:DB_PORT="20325"
$env:DB_NAME="defaultdb"
$env:DB_USERNAME="avnadmin"
$env:DB_PASSWORD="your-password"

cd backend
mvn spring-boot:run
```

### Frontend (Port 5173, proxies /api → :8080)
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173

---

## Deployment

### Backend — Render / Railway / any Java host
```bash
cd backend
mvn clean package
# Produces: backend/target/easyreads-backend-1.0.0.jar
java -jar target/easyreads-backend-1.0.0.jar
```
Set the 5 env vars above. Configure CORS if needed via environment override.

### Frontend — Vercel / Netlify / static host
```bash
cd frontend
npm install
npm run build
# Output: frontend/dist/ → upload as static site
```
Set `VITE_API_URL` env var during build to point at your deployed backend.

---

## v2 Migration Notes (v1 → v2)

| Aspect              | v1 (MERN)               | v2 (Spring Boot)       |
|---------------------|----------------------------|-------------------------|
| Backend runtime     | Node.js + Express          | Java 17 + Spring Boot 3.2 |
| Database            | MongoDB Atlas (Mongoose)    | MySQL 8 (Spring Data JPA, Hibernate) |
| PDF extraction      | pdf-parse (Node native) | Apache PDFBox 3.0.2   |
| File storage        | Optional Cloudinary + server/   | MySQL @Lob LONGBLOB (in DB, no external storage) |
| Password hashing    | Custom salted hash        | BCryptPasswordEncoder (Spring Security Crypto) |
| Serverless ready      | Vercel /api functions | Standard JAR (Render-compatible) |
| Response DTO names    | `_id` (ObjectId)        | `_id` (String valueOf(Long id) for compatibility |

**Frontend unchanged**: full compatibility preserved by the `ApiResponse` DTO field naming convention.

---

## License

MIT
