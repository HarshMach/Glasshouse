# The GlassHouse - AI-Powered News Platform Backend

A modular, production-ready backend for The GlassHouse news aggregation platform with AI-powered summarization and daily impact analysis.

## 🏗️ Architecture

### Modular Design
```
functions/
├── src/
│   ├── config/
│   │   └── constants.js          # All configuration constants
│   ├── services/
│   │   ├── rssService.js          # RSS feed fetching with circuit breaker
│   │   ├── aiService.js           # AI processing (Gemini)
│   │   ├── imageService.js        # Stock image fetching
│   │   ├── deduplicationService.js # Article deduplication
│   │   └── storageService.js      # Firestore operations
│   ├── utils/
│   │   └── helpers.js             # Utility functions
│   └── index.js                   # Cloud Functions entry point
```

## ✨ Features

### Core Functionality
- **RSS Feed Aggregation**: Fetches news from 12+ major sources
- **AI Quality Filtering**: Evaluates articles (1-10 scale), skips low-quality content
- **Smart Categorization**: AI-powered category detection
- **Enhanced Summaries**: Clear, actionable 2-3 sentence summaries
- **Daily Life Impact Analysis**: Comprehensive impact on finances, health, rights, etc.
- **Stock Images**: Auto-fetch relevant images from Unsplash/Pexels
- **Deduplication**: Merges similar articles from multiple sources
- **Engagement Metrics**: Likes, shares, views, comments
- **Reporting System**: User-reportable content
- **Search with Fuzzy Matching**: Find articles even with typos

### AI Capabilities
- **Quality Evaluation**: Filters out clickbait, gossip, promotional content
- **Category Detection**: Intelligently categorizes news
- **Context-Aware Summaries**: What, who, when, where, why format
- **Impact Analysis**: Explains how news affects daily life (financial, health, safety, etc.)
- **Rate Limiting**: Respects Gemini free tier (15 req/min)

### Automation
- **RSS Fetching**: Every 2 hours
- **AI Processing**: Every 30 minutes
- **Cleanup**: Monthly deletion of old articles

## 🚀 Setup

### Prerequisites
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Blaze plan (for scheduled functions)

### Environment Variables
Set these in Firebase Functions config:

```bash
# Required
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Optional (for stock images)
firebase functions:config:set unsplash.api_key="YOUR_UNSPLASH_ACCESS_KEY"
firebase functions:config:set pexels.api_key="YOUR_PEXELS_API_KEY"

# Optional (for admin API endpoints)
firebase functions:config:set api.key="YOUR_SECRET_API_KEY"
```

Or use `.env` file for local development:
```
GEMINI_API_KEY=your_gemini_api_key
UNSPLASH_API_KEY=your_unsplash_key
PEXELS_API_KEY=your_pexels_key
API_KEY=your_secret_key
```

### Installation

```bash
cd functions
npm install
```

### Deployment

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules and indexes
firebase deploy --only firestore
```

### Local Development

```bash
cd functions
npm run serve
```

## 📡 API Endpoints

### Public Endpoints (No Auth Required)

#### Get Articles
```
GET /getArticles?category=politics&limit=50
```
Returns processed, high-quality articles.

**Query Parameters:**
- `category` (optional): politics, world, tech, business, science, health, sports, entertainment, general, or "all"
- `limit` (optional): 1-100, default 50

#### Search Articles
```
GET /searchArticles?q=economy&limit=50
```
Fuzzy search across titles, summaries, and categories.

**Query Parameters:**
- `q` (required): Search query (min 2 chars)
- `limit` (optional): 1-100, default 50

#### Track View
```
POST /trackView
Content-Type: application/json

{
  "articleId": "article_id_here"
}
```

#### Toggle Like
```
POST /toggleLike
Content-Type: application/json

{
  "articleId": "article_id_here",
  "userId": "user_unique_id"
}
```

Returns: `{ "success": true, "liked": true/false, "likes": 42 }`

#### Track Share
```
POST /trackShare
Content-Type: application/json

{
  "articleId": "article_id_here"
}
```

#### Add Comment
```
POST /addComment
Content-Type: application/json

{
  "articleId": "article_id_here",
  "userId": "user_unique_id",
  "username": "User Name",
  "text": "Comment text (1-500 chars)"
}
```

#### Get Comments
```
GET /getComments?articleId=abc123&limit=50
```

#### Report Content
```
POST /reportContent
Content-Type: application/json

{
  "contentType": "article" or "comment",
  "contentId": "content_id_here",
  "reason": "Reason for report",
  "reportedBy": "user_unique_id"
}
```

### Admin Endpoints (API Key Required)

Add header: `x-api-key: YOUR_API_KEY`

#### Fetch News Manually
```
POST /fetchNews
x-api-key: YOUR_API_KEY
```

Fetches from RSS, deduplicates, saves to Firestore.

#### Process Articles with AI
```
POST /processArticles
x-api-key: YOUR_API_KEY
```

Processes up to 50 unprocessed articles with AI.

## 📊 Data Schema

### Article Document
```javascript
{
  // Original data
  title: string,
  description: string,
  link: string,
  pubDate: Timestamp,
  source: string,
  category: string,
  imageUrl: string | null,
  originalId: string,
  
  // Deduplication data
  sources: [string],
  links: [{ source: string, url: string }],
  descriptions: [string],
  sourceDiversity: number,
  
  // AI-generated
  summary: string,
  dailyLifeImpact: string | null,
  qualityScore: number,
  qualityReason: string,
  
  // Stock image
  stockImage: {
    url: string,
    thumbnail: string,
    photographer: string,
    photographerUrl: string,
    source: 'unsplash' | 'pexels'
  } | null,
  
  // Engagement
  likes: number,
  likedBy: [string],
  shares: number,
  views: number,
  commentCount: number,
  
  // Metadata
  processed: boolean,
  fetchedAt: Timestamp,
  processedAt: Timestamp
}
```

### Comment Document
```javascript
{
  articleId: string,
  userId: string,
  username: string,
  text: string,
  createdAt: Timestamp,
  reported: boolean
}
```

### Report Document
```javascript
{
  contentType: 'article' | 'comment',
  contentId: string,
  reason: string,
  reportedBy: string,
  createdAt: Timestamp,
  resolved: boolean
}
```

## 🎛️ Configuration

### Adjusting AI Quality Threshold
In `src/config/constants.js`:
```javascript
AI_CONFIG: {
  MIN_ARTICLE_QUALITY_SCORE: 3, // Change to 5 for stricter filtering
  // ...
}
```

### Modifying RSS Sources
In `src/config/constants.js`:
```javascript
const RSS_SOURCES = [
  {
    name: 'Source Name',
    url: 'https://example.com/rss',
    category: CATEGORIES.POLITICS,
    priority: 'high',
  },
  // Add more...
];
```

### Adjusting Scheduled Function Timing
In `src/index.js`:
```javascript
exports.scheduledFetchNews = onSchedule({
  schedule: 'every 1 hours', // Change as needed
  // ...
});
```

## 🧪 Testing

### Test Endpoints Locally
```bash
# Fetch news
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/fetchNews \
  -H "x-api-key: test_key"

# Get articles
curl http://localhost:5001/YOUR_PROJECT/us-central1/getArticles?category=tech

# Search
curl http://localhost:5001/YOUR_PROJECT/us-central1/searchArticles?q=climate
```

## 🔍 Monitoring

### View Logs
```bash
firebase functions:log
```

### Check Function Status
- Firebase Console → Functions
- Monitor execution counts, errors, and durations

## 🚦 Rate Limiting

### Gemini API (Free Tier)
- 15 requests/minute
- 1,500 requests/day
- Built-in rate limiting in `aiService.js`
- 4-second delay between requests

### Unsplash API
- 50 requests/hour (free tier)

### Pexels API
- 200 requests/hour (free tier)

## 🎯 Performance Tips

1. **Scheduled Functions**: Run during off-peak hours
2. **Batch Size**: Adjust `AI_PROCESSING_BATCH_SIZE` in constants
3. **Article Limit**: Set `AI_MAX_ARTICLES_PER_RUN` based on your quota
4. **Deduplication**: Reduces storage and improves quality

## 🐛 Troubleshooting

### No articles showing in frontend
- Check if `processed = true` and `qualityScore >= 3`
- Run `/processArticles` manually
- Check Firebase logs for errors

### AI processing failing
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota limits
- Review logs for specific errors

### RSS feeds not fetching
- Check circuit breaker state in Firestore
- Verify RSS URLs are still valid
- Check for network/timeout errors in logs

## 📝 License

MIT

## 👥 Contributing

1. Follow the modular structure
2. Add proper error handling
3. Update README with new features
4. Test thoroughly before deploying

## 🔮 Future Enhancements

- [ ] Web search integration for AI (using Google Custom Search)
- [ ] User accounts and personalization
- [ ] Email digests
- [ ] Trending topics detection
- [ ] Sentiment analysis
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Article bookmarking
- [ ] Advanced analytics dashboard
