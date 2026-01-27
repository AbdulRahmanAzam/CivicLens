# CivicLens Backend – LLM Orientation Guide

A compact map of the backend so an LLM can navigate and discuss implementation details confidently.

## Architecture at a Glance

- **Runtime/Stack**: Node.js 18+, Express 5, MongoDB/Mongoose, Multer, Cloudinary, Baileys (WhatsApp), Groq + rule-based NLP, ffmpeg for audio.
- **Entrypoint**: `src/server.js` (connects DB, seeds categories, starts Express). Express app lives in `src/app.js` (security, CORS, logging, JSON parsing, routes, error handling).
- **Base path**: All APIs are under `/api/v1` (see `src/routes`). Health check: `/api/v1/health`.
- **Request flow**: Route → controller → service (business logic/AI) → Mongoose models → response; errors funnel through `middlewares/errorHandler.js`.

## Key Folders & Roles (`src/`)

- `config/`: `env.js` (loads/validates .env, helper flags), `db.js` (connect/disconnect Mongo).
- `routes/`: Route groupings (`complaintRoutes`, `categoryRoutes`, `voiceRoutes`) mounted in `routes/index.js`.
- `controllers/`: Thin HTTP handlers calling services (`complaintController`, `categoryController`, `voiceController`).
- `services/`: Core logic & AI pipeline
  - `complaintService`: Orchestrates create/list/get/update, stats/heatmap, AI stats.
  - `classificationService`: GROQ LLM first, falls back to local keyword/TF-IDF; caches results.
  - `duplicateService`: Geo + text similarity to flag/link duplicates.
  - `severityService`: Rule-based severity scoring and trends.
  - `geoService`: Reverse geocoding + geo helpers.
  - `cloudinaryService`: Image uploads.
  - `speechService`: Audio transcription via Groq (see voice features).
  - `sessionService`, `whatsappService`, `whatsappConversationService`: WhatsApp session handling via Baileys.
- `models/`: Mongoose schemas (`Complaint`, `Category`, `User`, `WhatsAppSession`, index loader).
- `middlewares/`: Validation (`validateRequest`), file upload (`uploadMiddleware`), error handling (`errorHandler`, `notFound`).
- `utils/`: Helpers (ID generation, pagination, geo helpers), constants (HTTP codes/messages, limits), audio utils.
- Top-level: `whatsappBot.js` (WhatsApp listener bootstrapping), `app.js`, `server.js`.

## Core Data Models (high level)

- `Complaint`
  - `complaintId` (generated), `citizenInfo` (name/phone/email), `description`.
  - `category`: `primary` (Roads/Water/Garbage/Electricity/Others), `confidence`, `subcategory`, `urgency`, `keywords`, `classificationSource`, `needsReview`.
  - `location`: GeoJSON Point (`coordinates [lng, lat]`), `address`, `area`, `ward`, `pincode`; 2dsphere + helper indexes.
  - `images`: `{url, publicId, analysis}` up to 5.
  - `source`: web/mobile/whatsapp/voice.
  - `status`: `current` + `history` subdocs; instance method `updateStatus` enforces transitions.
  - `severity`: `score` 1–10, `priority` (low/medium/high/critical), factors.
  - `duplicateOf`, `linkedComplaints`, `assignedTo`, `resolution`, `metadata.aiProcessing`.
- `Category`: Fixed set (Roads, Water, Garbage, Electricity, Others) with keywords, department, priority, SLA; static `seedDefaults`, `classifyByKeywords`.
- `User`: Basic profile/role schema (used for assignment).
- `WhatsAppSession`: Stores Baileys session creds/qr/status.

## Model Schemas (concise)

- `Complaint` (indexes: 2dsphere on `location`, `category.primary`, `status.current`, `createdAt`, `severity.score`)
  - Identity: `complaintId` unique; timestamps enabled.
  - Citizen: `citizenInfo.name?`, `phone` (required, regex), `email?`.
  - Content: `description` (required, max 2000 chars), `images[]` max 5 with `url/publicId/analysis`.
  - Category: `primary` enum (5 values) + `confidence`, `subcategory`, `urgency`, `keywords[]`, `classificationSource`, `needsReview`.
  - Location: GeoJSON Point `coordinates [lng, lat]` required + `address/area/ward/pincode`.
  - Status: `status.current` enum with history subdocs; method `updateStatus` validates transitions and stamps history/resolution.
  - Severity: `score` 1–10, `priority` enum, `factors` (frequency/duration/areaImpact/etc).
  - Links: `duplicateOf`, `linkedComplaints[]`, `assignedTo`, `resolution` (description/resolvedAt/by, citizen feedback), `metadata.aiProcessing`.
- `Category` (indexes: `name`, `isActive`)
  - Fields: `name` enum (5 values, unique, required), `description`, `keywords[]`, `department`, `priority` 1–5, `icon`, `color`, `isActive`, `avgResolutionTime`, `slaHours`.
  - Statics: `seedDefaults()`, `classifyByKeywords(text)`.
- `User`
  - Fields: `name`, `email` unique, `phone`, `role` enum (`citizen|officer|admin`), `department`, `status` enum (`active|inactive`), `lastLogin`.
- `WhatsAppSession`
  - Fields: `sessionId`, `userId?`, `creds` (Baileys auth json), `qrData`, `status` enum (`active|expired|pending`), `lastSynced`, `metadata` (device/platform/phone).

## API Surface (mounted at `/api/v1`)

- **Complaints (`routes/complaintRoutes.js`)**
  - `POST /complaints`: Create (uploads via `uploadImagesMiddleware`, validation via `validateRequest`). Triggers AI pipeline: reverse geocode → image upload → classify → duplicate check → severity.
  - `GET /complaints`: List with filters (category/status/geo/severity/date/pagination) and sorting.
  - `GET /complaints/:id`: Fetch by `complaintId` or Mongo `_id`.
  - `PATCH /complaints/:id/status`: Status transition with history.
  - `GET /complaints/stats`: Aggregated stats; `GET /complaints/heatmap`: grid clusters; `GET /complaints/ai-stats`: AI pipeline metrics.
- **Categories (`routes/categoryRoutes.js`)**
  - `GET /categories`: List (optionally `active=true|false`).
  - `GET /categories/:name`: Single category.
  - `POST /categories/seed`: Seed defaults.
  - `POST /categories/classify`: Keyword-based category suggestion.
  - `GET /categories/stats`: Complaint distribution by category.
- **Voice (`routes/voiceRoutes.js`)**
  - `POST /voice/complaint`: Upload audio (multer memory, 10MB, common audio mimetypes) → validate → transcribe via `speechService` → create complaint.
  - `POST /voice/transcribe`: Transcribe-only.
  - `GET /voice/status`, `GET /voice/languages`: Service health + supported langs.
- **Root/Health**: `/api/v1/health`, `/` root banner in `app.js`.

## Validation, Files, and Errors

- **Validation**: `middlewares/validateRequest.js` centralizes express-validator schemas for complaints (create/list/get/status/stats).
- **Uploads**: `middlewares/uploadMiddleware.js` wraps Multer; enforces max 5 images and file types, sets `req.files` for services.
- **Errors**: `middlewares/errorHandler.js` exports `asyncHandler`, `AppError`, `errorHandler`, `notFound`. Controllers are wrapped to route errors to the global handler; responses follow `{ success: false, message, errors? }`.

## AI/Geospatial Pipeline (complaint creation)

1. **Reverse geocode** (`geoService.reverseGeocode`) to enrich location from lat/lng; overrides with user `address` if provided.
2. **Image upload** to Cloudinary (best effort; failures are logged but do not block complaint creation).
3. **Classification** (`classificationService.classifyComplaint`): GROQ LLM (`llama-3.1-8b-instant`, JSON response) → fallback to local keyword/TF-IDF. Adds `needsReview` when confidence < 0.6.
4. **Duplicate detection** (`duplicateService.checkForDuplicates`): Text similarity + geo proximity; links duplicates if found.
5. **Severity scoring** (`severityService.calculateSeverity`): Rule-based factors (category urgency, location impact, citizen urgency) returning score/priority/factors.
6. **Persist** `Complaint` with enriched data; status history initialized to `reported`.

## Environment & Config

Populate `.env` (template in `.env.example`). Important keys:

- `PORT`, `NODE_ENV`, `MONGODB_URI`, `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GOOGLE_MAPS_API_KEY` (reverse geocoding)
- `GROQ_API_KEY` (LLM classification + speech)
- `JWT_SECRET`, `JWT_EXPIRES_IN` (future auth)
- WhatsApp/Baileys session is file-based; no token envs required by default.

## How to Run

```bash
cd backend
npm install
cp .env.example .env   # fill values
npm run dev            # nodemon src/server.js
```

## Quick Mental Model for Changes

- **Add a new endpoint**: Define route → controller → service method → model ops; wire validations and error handling.
- **Extend AI pipeline**: Tweak services (`classificationService`, `duplicateService`, `severityService`); keep controller thin.
- **Data shape**: Keep `Complaint` GeoJSON coordinates as `[lng, lat]`; respect status transitions enforced in `Complaint.updateStatus`.
- **Testing hooks**: Jest setup via `npm test`; no test files yet, so add under `__tests__/` and use `supertest` for HTTP.

With this map, you can ask focused questions (e.g., “walk through duplicate detection internals” or “where to plug a new LLM model”) and navigate files quickly.