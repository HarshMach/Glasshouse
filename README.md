# The GlassHouse – AI Powered News Backend

This repository contains the backend for The GlassHouse, an AI powered news platform that curates, analyzes, and enhances news from reputable sources. The goal is to give readers clear, concise, and practical insights into how the news affects their daily lives.

---

## Vision

The GlassHouse is built to answer one simple question:

**"There is too much news every day. What actually matters, and how does it affect me?"**

The backend follows these core principles:

1. **Signal over noise**  
   Only show stories that are meaningful and filter out low quality, repetitive, or clickbait content.

2. **Daily life relevance**  
   Highlight practical impacts on finances, safety, rights, health, and global outcomes.

3. **Multi source truth**  
   Merge similar stories from multiple publishers into a single, coherent article while preserving diversity of sources.

4. **AI as an editor**  
   Use AI to summarize, classify, and contextualize news. The system enhances journalism but does not replace it.

5. **Healthy information diet**  
   Encourage thoughtful reading by offering summaries, impact explanations, and well organized categories instead of endless scrolling.

---

## High Level Overview

This backend uses Firebase Cloud Functions to:

- Ingest RSS news from curated sources  
- Clean and normalize titles, descriptions, dates, and metadata  
- Deduplicate similar stories  
- Use Gemini AI to:
  - Score article quality
  - Categorize topics
  - Summarize content
  - Generate daily life impact explanations
  - Produce image prompts  
- Fetch stock images from Unsplash and Pexels  
- Handle engagement features such as views, likes, shares, and comments  
- Expose public and admin APIs  
- Run scheduled jobs for automated processing

---

## Features

### 1. News Ingestion and Cleaning

- Fetches RSS feeds from BBC, The Guardian, New York Times, Washington Post, TechCrunch, Bloomberg, and more.
- Includes a circuit breaker to avoid failing sources.
- Cleans HTML, removes unsafe content, and normalizes metadata fields.

---

### 2. Intelligent Deduplication

Found in `src/services/deduplicationService.js`.

Deduplication includes:
- Exact and fuzzy title matching  
- Keyword based grouping  
- Time window checks  
- Merging related stories into a single article  

Each unified story contains:
- Combined sources  
- Links from all publishers  
- Combined descriptions  
- A selected best quality image  

---

### 3. AI Powered Summarization and Impact Analysis

Found in `src/services/aiService.js`.

Powered by Google Gemini using `@google/generative-ai`.  
The AI performs:

- Quality scoring  
- Topic classification (politics, world, business, tech, science, general)  
- Neutral summarization  
- Daily life impact explanation  
- Image prompt generation  

Safeguards prevent:
- Publishing low quality stories  
- Summaries that copy from the original article  

---

### 4. Visual Enrichment

Found in `src/services/imageService.js`.

Image retrieval includes:
1. Using AI generated keywords  
2. Falling back to category based queries  
3. Using a generic fallback such as "news"  

Sources include:
- Unsplash  
- Pexels  

---

### 5. Engagement and Community Features

Stored in Firestore and accessible through APIs.  
Includes:

- Views  
- Likes with per user toggling  
- Shares  
- Comment counts  
- Adding comments  
- Fetching comments  
- Reporting system for moderation  

---

### 6. Public and Admin API Endpoints

Implemented in `src/index.js`.

**Health Check**
- GET `/health`

**Admin Endpoints** (protected by API key)
- POST `/fetchNews`
- POST `/processArticles`

**Public Content**
- GET `/getArticles`
  - category
  - sortBy
  - limit
  - cursor for pagination

**Engagement**
- POST `/trackView`
- POST `/toggleLike`
- POST `/trackShare`

**Comments**
- POST `/addComment`
- GET `/getComments`

All endpoints include CORS and validation.

---

### 7. Scheduled Jobs

- Fetch news every 2 hours  
- Process articles every 30 minutes  
- Clean up old articles monthly  

---

## Architecture

**Runtime:** Node.js 20  
**Platform:** Firebase Cloud Functions v2  
**Database:** Firestore  
**AI:** Gemini via `@google/generative-ai`  
**RSS:** rss-parser  
**Images:** Unsplash API and Pexels API  
**Optional Search:** Brave Search API  
**Linting:** ESLint with the Google config

Key modules:
- `src/index.js` for Cloud Functions entry point  
- `src/services/rssService.js` for RSS ingestion  
- `src/services/aiService.js` for AI processing  
- `src/services/deduplicationService.js` for grouping logic  
- `src/services/imageService.js` for image selection  
- `src/services/storageService.js` for Firestore operations  
- `src/utils/helpers.js` for utilities  
- `src/config/constants.js` for configuration  

---

## Data Model

### Article Document (collection: articles)

- Core fields  
  - title  
  - description  
  - link  
  - source  
  - category  
  - pubDate  

- AI fields  
  - summary  
  - dailyLifeImpact  
  - qualityScore  
  - qualityReason  
  - processed  
  - processedAt  

- Aggregation fields  
  - sources  
  - links  
  - combinedDescription  
  - sourceDiversity  
  - uniqueCategories  

- Visual fields  
  - imageUrl  
  - stockImage metadata  

- Engagement fields  
  - likes  
  - shares  
  - views  
  - commentCount  
  - likedBy  

### Comment Document (collection: comments)

- articleId  
- userId  
- username  
- text  
- createdAt  
- reported  

### Report Document (collection: reports)

- contentType  
- contentId  
- reason  
- reportedBy  
- createdAt  
- resolved  

---

## Security, Rate Limiting, and Reliability

- API key protection for admin routes  
- Rate limiting using Firestore backed counters  
- Circuit breaker for unstable RSS sources  
- Strict input sanitization  
- Unsafe HTML removal  
- Defensive checks around AI output  

These safeguards support a stable and abuse resistant system.

---

## Roadmap and Future Vision

Potential future improvements include:

1. Personalization and user preferences  
2. Source bias transparency  
3. Richer explanatory articles and timelines  
4. Multilingual summaries and global coverage  
5. Stronger moderation tools  
6. Analytics for editorial insights  

The long term goal is for The GlassHouse to function like a personal daily briefing that prioritizes clarity, relevance, and depth.

