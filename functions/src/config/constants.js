/**
 * Configuration constants for The GlassHouse backend
 */

// Firestore Collections
const COLLECTIONS = {
  ARTICLES: 'articles',
  COMMENTS: 'comments',
  REPORTS: 'reports',
  RATE_LIMITS: 'rate_limits',
  CIRCUIT_BREAKER: 'circuit_breaker_state',
  ENGAGEMENT_METRICS: 'engagement_metrics',
};

// Processing limits
const LIMITS = {
  BATCH_SIZE: 499, // Firestore batch limit
  MAX_PROCESSING_TIME: 540000, // 9 minutes
  ARTICLE_RETENTION_DAYS: 30,
  RSS_FETCH_BATCH_SIZE: 5,
  AI_PROCESSING_BATCH_SIZE: 10,
  AI_MAX_ARTICLES_PER_RUN: 50,
};

// Rate limiting
const RATE_LIMITING = {
  MAX_REQUESTS_PER_HOUR: 100,
  RATE_LIMIT_WINDOW_MS: 3600000, // 1 hour
  GEMINI_REQUESTS_PER_MINUTE: 15, // Free tier limit
  GEMINI_DELAY_MS: 4000, // Delay between Gemini calls
};

// Circuit breaker
const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 3,
  TIMEOUT_MS: 3600000, // 1 hour
};

// Deduplication
const DEDUPLICATION = {
  SIMILARITY_THRESHOLD: 0.5,
  TIME_WINDOW_HOURS: 12,
};

// AI Processing
const AI_CONFIG = {
  MIN_ARTICLE_QUALITY_SCORE: 3, // Out of 10
  SUMMARY_MAX_LENGTH: 300,
  IMPACT_MAX_LENGTH: 200,
  MODEL_NAME: 'gemini-1.5-flash', // Using flash model for free tier
};

// Image settings
const IMAGE_CONFIG = {
  UNSPLASH_API_URL: 'https://api.unsplash.com/search/photos',
  PEXELS_API_URL: 'https://api.pexels.com/v1/search',
  DEFAULT_IMAGE_WIDTH: 800,
  FALLBACK_QUERY: 'news',
};

// Categories
const CATEGORIES = {
  POLITICS: 'politics',
  WORLD: 'world',
  BUSINESS: 'business',
  TECH: 'tech',
  SCIENCE: 'science',
  HEALTH: 'health',
  SPORTS: 'sports',
  ENTERTAINMENT: 'entertainment',
  GENERAL: 'general',
};

// RSS Sources
const RSS_SOURCES = [
  {
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: CATEGORIES.WORLD,
    priority: 'high',
  },
  {
    name: 'The Guardian World',
    url: 'https://www.theguardian.com/world/rss',
    category: CATEGORIES.WORLD,
    priority: 'high',
  },
  {
    name: 'NY Times US',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
    category: CATEGORIES.POLITICS,
    priority: 'high',
  },
  {
    name: 'Washington Post Politics',
    url: 'https://www.washingtonpost.com/arcio/rss/category/politics/?itid=lk_inline_manual_2',
    category: CATEGORIES.POLITICS,
    priority: 'high',
  },
  {
    name: 'The Nation',
    url: 'https://www.thenation.com/subject/politics/feed/',
    category: CATEGORIES.POLITICS,
    priority: 'high',
  },
  {
    name: 'Rolling Stone Politics',
    url: 'https://www.rollingstone.com/politics/feed/',
    category: CATEGORIES.POLITICS,
    priority: 'high',
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: CATEGORIES.TECH,
    priority: 'high',
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: CATEGORIES.TECH,
    priority: 'high',
  },
  {
    name: 'CNBC Business',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    category: CATEGORIES.BUSINESS,
    priority: 'high',
  },
  {
    name: 'Bloomberg Markets',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: CATEGORIES.BUSINESS,
    priority: 'high',
  },
  {
    name: 'Science Daily',
    url: 'https://www.sciencedaily.com/rss/top/science.xml',
    category: CATEGORIES.SCIENCE,
    priority: 'medium',
  },
  {
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    category: CATEGORIES.SPORTS,
    priority: 'medium',
  },
];

module.exports = {
  COLLECTIONS,
  LIMITS,
  RATE_LIMITING,
  CIRCUIT_BREAKER,
  DEDUPLICATION,
  AI_CONFIG,
  IMAGE_CONFIG,
  CATEGORIES,
  RSS_SOURCES,
};
