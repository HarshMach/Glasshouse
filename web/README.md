# The GlassHouse – Web Frontend

Next.js + Tailwind frontend for The GlassHouse, wired to the Firebase Functions backend.

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local
# edit .env.local and set NEXT_PUBLIC_API_BASE_URL
```

### API base URL

- **Production (example):**
  - `NEXT_PUBLIC_API_BASE_URL=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net`
- **Local emulator (example):**
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/YOUR_PROJECT_ID/us-central1`

This should match where your Cloud Functions (e.g. `getArticles`, `searchArticles`, `trackView`, etc.) are exposed.

## Running the app

```bash
cd web
npm run dev
```

Then open http://localhost:3000 in your browser.

The homepage shows:
- A search bar with fuzzy search powered by `/searchArticles`
- Category filters (politics, world, tech, etc.) using `/getArticles`
- A grid of articles (only AI-processed items with summaries + daily impact)
- A detail modal with likes, shares, comments, reporting, and a link to the full article.
