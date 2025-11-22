# Agentic Image Studio

Agentic Image Studio is a Next.js web application for conversational AI image generation and live iterative editing using Google Imagen models. Users can chat with the assistant, upload reference images, and apply consecutive refinements to evolve their artwork in real time.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file based on `.env.local.example` and provide your Google AI Studio key:

```
GOOGLE_API_KEY=your_key_here
# Optional: override default model slug (e.g. imagen-3.0-ultra)
# GOOGLE_IMAGE_MODEL=imagen-3.0-generate
```

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000 to access the studio.

### 4. Production build

```bash
npm run build
npm start
```

### 5. Deploy to Vercel

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-75249532
```

## Features

- Conversational chat UI for prompt-based generation and iterative edits
- Session gallery with quick re-selection of prior renders
- Optional base image upload to guide edits
- Aspect ratio and resolution controls surfaced inline
- Responsive Tailwind CSS layout suitable for desktop and tablet displays

## Tech Stack

- Next.js 14 (App Router) & React 18
- Tailwind CSS for styling
- Google Generative AI HTTP API (Imagen models)

## Scripts

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run start` – serve production build
- `npm run lint` – lint using Next.js ESLint config
- `npm run type-check` – run TypeScript compiler in check mode
- `npm test` – alias for `lint` + `type-check`

## Project Structure

```
app/
 ├─ api/generate-image/route.ts  # Edge API route that calls Google AI
 ├─ globals.css                  # Tailwind base styles
 └─ page.tsx                     # Main conversational UI
lib/
 └─ types.ts                     # Shared types
```

## Notes

- The app defaults to `imagen-3.0-generate`. Override `GOOGLE_IMAGE_MODEL` if your key has access to a different Imagen tier (2.5 or 3.0).
- The API route expects PNG/JPEG base64 payloads. Uploaded assets stay client-side until sent with a prompt.
- All image responses are delivered as base64 data URIs for instant preview.
