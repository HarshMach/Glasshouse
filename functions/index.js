// index.js — Simplified Version (Only Essential Fields)
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const Parser = require("rss-parser");
const stringSimilarity = require("string-similarity");
const crypto = require("crypto");
const { URL } = require("url");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    process.exit(1);
  }
}

setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

const db = admin.firestore();
const parser = new Parser();

// ========== CONFIG CONSTANTS ==========
const BATCH_SIZE_LIMIT = 499;
const SIMILARITY_THRESHOLD = 0.5;
const MAX_PROCESSING_TIME = 540000;
const ARTICLE_RETENTION_DAYS = 30;
const API_KEY_HEADER = "x-api-key";

const CIRCUIT_BREAKER_COLLECTION = "circuit_breaker_state";
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_TIMEOUT_MS = 3600000;

const RATE_LIMIT_COLLECTION = "rate_limits";
const MAX_REQUESTS_PER_HOUR = 100;
const RATE_LIMIT_WINDOW_MS = 3600000;
// Initialize Gemini AI
const GEMINI_API_KEY = "AIzaSyCmJG_IAJKVWBYNDk5ISHuQecPRG6KQ7Tw";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Health check endpoint - required for Cloud Run
exports.health = onRequest(
  { memory: "128MiB", timeoutSeconds: 60 },
  async (req, res) => {
    res
      .status(200)
      .json({ status: "healthy", timestamp: new Date().toISOString() });
  }
);

const RSS_SOURCES = [
  {
    name: "thenation",
    url: "https://www.thenation.com/subject/politics/feed/",
    category: "politics",
    priority: "high",
  },
  {
    name: "BBC",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "general",
    priority: "high",
  },
  {
    name: "WashingtonPost",
    url: "https://www.washingtonpost.com/arcio/rss/category/politics/?itid=lk_inline_manual_2",
    category: "politics",
    priority: "high",
  },
  {
    name: "WashingtonPost",
    url: "https://feeds.washingtonpost.com/rss/world?itid=lk_inline_manual_26",
    category: "general",
    priority: "high",
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    category: "general",
    priority: "high",
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "tech",
    priority: "high",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    category: "tech",
    priority: "high",
  },
  {
    name: "CNBC",
    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    category: "business",
    priority: "high",
  },
  {
    name: "Bloomberg",
    url: "https://feeds.bloomberg.com/markets/news.rss",
    category: "business",
    priority: "high",
  },
  {
    name: "ESPN",
    url: "https://www.espn.com/espn/rss/news",
    category: "sports",
    priority: "high",
  },
  {
    name: "Science",
    url: "https://www.sciencedaily.com/rss/top/science.xml",
    category: "science",
    priority: "medium",
  },
  {
    name: "NY Times US",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
    category: "politics",
    priority: "high",
  },
  {
    name: "Rolling Stone",
    url: "https://www.rollingstone.com/politics/feed/",
    category: "politics",
    priority: "high",
  },
];

// ========== UTILITY FUNCTIONS ==========
async function shouldSkipSource(sourceName) {
  try {
    const stateDoc = await db
      .collection(CIRCUIT_BREAKER_COLLECTION)
      .doc(sourceName)
      .get();
    if (!stateDoc.exists) return false;
    const state = stateDoc.data();
    const now = Date.now();
    if (state.state === "open") {
      if (now - state.lastFailure > CIRCUIT_TIMEOUT_MS) {
        await db.collection(CIRCUIT_BREAKER_COLLECTION).doc(sourceName).update({
          state: "half-open",
          count: 0,
        });
        console.log(`Circuit breaker half-open for ${sourceName}`);
        return false;
      }
      console.log(`Circuit breaker open, skipping ${sourceName}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error checking circuit breaker for ${sourceName}:`, error);
    return false;
  }
}

async function recordSourceFailure(sourceName) {
  try {
    const stateRef = db.collection(CIRCUIT_BREAKER_COLLECTION).doc(sourceName);
    const stateDoc = await stateRef.get();
    const now = Date.now();
    let state = { count: 0, lastFailure: 0, state: "closed" };
    if (stateDoc.exists) state = stateDoc.data();
    state.count++;
    state.lastFailure = now;
    if (state.count >= CIRCUIT_FAILURE_THRESHOLD) {
      state.state = "open";
      console.log(
        `Circuit breaker opened for ${sourceName} after ${state.count} failures`
      );
    }
    await stateRef.set(state, { merge: true });
  } catch (error) {
    console.error(`Error recording failure for ${sourceName}:`, error);
  }
}

async function recordSourceSuccess(sourceName) {
  try {
    const stateRef = db.collection(CIRCUIT_BREAKER_COLLECTION).doc(sourceName);
    const stateDoc = await stateRef.get();
    if (stateDoc.exists && stateDoc.data().state === "half-open") {
      await stateRef.set({ state: "closed", count: 0 }, { merge: true });
      console.log(`Circuit breaker closed for ${sourceName}`);
    }
  } catch (error) {
    console.error(`Error recording success for ${sourceName}:`, error);
  }
}

function verifyApiKey(req) {
  const apiKey = req.headers[API_KEY_HEADER];
  const validApiKey = process.env.API_KEY;
  if (!validApiKey) {
    console.warn("API_KEY not configured - authentication disabled");
    return true;
  }
  return apiKey === validApiKey;
}

const rateLimiter = {
  async isAllowed(ip) {
    try {
      const now = Date.now();
      const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(ip);
      const doc = await docRef.get();
      if (!doc.exists || now > doc.data().resetTime) {
        await docRef.set({
          count: 1,
          resetTime: now + RATE_LIMIT_WINDOW_MS,
          lastUpdated: now,
        });
        return true;
      }
      const record = doc.data();
      if (record.count >= MAX_REQUESTS_PER_HOUR) {
        return false;
      }
      await docRef.update({
        count: admin.firestore.FieldValue.increment(1),
        lastUpdated: now,
      });
      return true;
    } catch (error) {
      console.error("Rate limiter error:", error);
      return true;
    }
  },
  async getRemainingRequests(ip) {
    try {
      const now = Date.now();
      const doc = await db.collection(RATE_LIMIT_COLLECTION).doc(ip).get();
      if (!doc.exists || now > doc.data().resetTime) {
        return MAX_REQUESTS_PER_HOUR;
      }
      const record = doc.data();
      return Math.max(0, MAX_REQUESTS_PER_HOUR - record.count);
    } catch (error) {
      console.error("Error getting remaining requests:", error);
      return MAX_REQUESTS_PER_HOUR;
    }
  },
};

function isValidRSSUrl(url) {
  try {
    if (!url || typeof url !== "string") return false;
    const parsedUrl = new URL(url);
    const rssIndicators = ["rss", "feed", "xml", "atom"];
    const hasRssIndicator = rssIndicators.some(
      (indicator) =>
        parsedUrl.pathname.toLowerCase().includes(indicator) ||
        parsedUrl.hostname.toLowerCase().includes(indicator)
    );
    const rssExtensions = [".rss", ".xml", ".atom"];
    const hasRssExtension = rssExtensions.some((ext) =>
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );
    const rssPaths = ["/rss/", "/feed/", "/feeds/", "/news/", "/blog/"];
    const hasRssPath = rssPaths.some((path) =>
      parsedUrl.pathname.toLowerCase().includes(path)
    );
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }
    return hasRssIndicator || hasRssExtension || hasRssPath;
  } catch (error) {
    console.error("URL validation error:", error);
    return false;
  }
}

function isValidUrl(url) {
  try {
    if (!url || typeof url !== "string") return false;
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

function sanitizeRSSItem(item) {
  if (!item || typeof item !== "object") {
    return {};
  }
  try {
    const sanitized = {};
    const stringFields = [
      "title",
      "link",
      "description",
      "content",
      "contentSnippet",
    ];
    stringFields.forEach((field) => {
      if (item[field] && typeof item[field] === "string") {
        sanitized[field] = item[field]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .replace(/data:\s*text\/html/gi, "")
          .trim();
      } else {
        sanitized[field] = item[field] || "";
      }
    });
    if (item.pubDate) {
      try {
        sanitized.pubDate = new Date(item.pubDate).toISOString();
      } catch (dateError) {
        sanitized.pubDate = new Date().toISOString();
      }
    }
    if (item.enclosure && typeof item.enclosure === "object") {
      sanitized.enclosure = {
        url: item.enclosure.url
          ? item.enclosure.url.replace(/javascript:/gi, "")
          : "",
        type: item.enclosure.type || "",
        length: item.enclosure.length || 0,
      };
    }
    return sanitized;
  } catch (error) {
    console.error("RSS item sanitization error:", error);
    return item;
  }
}

function cleanText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 500);
}

function extractImageUrl(item) {
  if (!item) return null;
  if (item.enclosure?.url) return item.enclosure.url;
  if (item["media:content"]?.$?.url) return item["media:content"].$.url;
  if (item["media:thumbnail"]?.$?.url) return item["media:thumbnail"].$.url;
  const imgMatch = (item.content || item.description || "").match(
    /<img[^>]+src="([^">]+)"/
  );
  return imgMatch ? imgMatch[1] : null;
}

function generateHash(str) {
  try {
    if (!str || typeof str !== "string")
      throw new Error("Invalid input for hash generation");
    return crypto
      .createHash("sha256")
      .update(str)
      .digest("hex")
      .substring(0, 32);
  } catch (error) {
    console.error("Hash generation error:", error);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36) + "_" + Date.now();
  }
}

// ========== SIMPLIFIED KEYWORD EXTRACTION (for deduplication only) ==========
function extractKeywords(title) {
  if (!title || typeof title !== "string") return [];
  const stopWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "about",
    "after",
    "says",
    "new",
  ];
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.includes(w));
}

// ========== FETCH & PROCESS LOGIC ==========
async function fetchRSSFeedsInBatches(batchSize = 5) {
  const allArticles = [];
  const startTime = Date.now();
  let processedSources = 0,
    failedSources = 0,
    skippedSources = 0;

  for (let i = 0; i < RSS_SOURCES.length; i += batchSize) {
    if (Date.now() - startTime > MAX_PROCESSING_TIME) {
      console.warn(
        "Processing time limit reached, stopping RSS feed processing"
      );
      break;
    }
    const batch = RSS_SOURCES.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        RSS_SOURCES.length / batchSize
      )} with ${batch.length} sources`
    );
    const batchArticles = await Promise.allSettled(
      batch.map(async (source) => {
        if (await shouldSkipSource(source.name)) {
          skippedSources++;
          return [];
        }
        if (!isValidRSSUrl(source.url)) {
          console.warn(`Invalid RSS URL for ${source.name}: ${source.url}`);
          failedSources++;
          await recordSourceFailure(source.name);
          return [];
        }
        try {
          console.log(`Fetching from ${source.name}...`);
          const feed = await Promise.race([
            parser.parseURL(source.url),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("RSS feed timeout")), 30000)
            ),
          ]);
          if (!feed || !feed.items || !Array.isArray(feed.items)) {
            throw new Error("Invalid feed response structure");
          }
          const articles = [];
          let validArticles = 0;
          for (const item of feed.items) {
            try {
              const sanitizedItem = sanitizeRSSItem(item);
              // SIMPLIFIED: Only essential fields
              const article = {
                title: sanitizedItem.title?.trim() || "",
                description: cleanText(
                  sanitizedItem.contentSnippet ||
                    sanitizedItem.description ||
                    sanitizedItem.content ||
                    ""
                ),
                link: sanitizedItem.link || "",
                pubDate: sanitizedItem.pubDate
                  ? new Date(sanitizedItem.pubDate)
                  : new Date(),
                source: source.name,
                category: source.category,
                imageUrl: extractImageUrl(sanitizedItem),
                originalId: generateHash(
                  sanitizedItem.link || sanitizedItem.title || ""
                ),
              };
              if (
                article.title &&
                article.description &&
                article.link &&
                isValidUrl(article.link)
              ) {
                articles.push(article);
                validArticles++;
              }
            } catch (articleError) {
              console.error(
                `Error processing article from ${source.name}:`,
                articleError.message
              );
            }
          }
          processedSources++;
          await recordSourceSuccess(source.name);
          console.log(
            `✓ Fetched ${validArticles}/${feed.items.length} valid articles from ${source.name}`
          );
          return articles;
        } catch (error) {
          failedSources++;
          await recordSourceFailure(source.name);
          console.error(`✗ Error fetching ${source.name}:`, error.message);
          return [];
        }
      })
    );
    batchArticles.forEach((result) => {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allArticles.push(...result.value);
      }
    });
    if (i + batchSize < RSS_SOURCES.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `RSS feed processing completed: ${processedSources} processed, ${failedSources} failed, ${skippedSources} skipped, ${allArticles.length} total articles`
  );
  return allArticles;
}

async function fetchAllRSSFeeds() {
  return await fetchRSSFeedsInBatches(5);
}

// ========== SIMPLIFIED DEDUPLICATION ==========
function deduplicateArticles(articles) {
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return [];
  }
  try {
    const sortedArticles = [...articles].sort((a, b) => b.pubDate - a.pubDate);

    const buckets = new Map();
    const timeWindow = 12 * 60 * 60 * 1000; // 12 hours

    sortedArticles.forEach((article, index) => {
      const keywords = extractKeywords(article.title)
        .slice(0, 3)
        .sort()
        .join("");
      const bucket = buckets.get(keywords) || [];
      bucket.push({ article, index });
      buckets.set(keywords, bucket);
    });

    const groups = [];
    const processed = new Set();

    for (const [bucketKey, bucket] of buckets) {
      for (const { article, index } of bucket) {
        if (processed.has(index)) continue;

        // SIMPLIFIED: Only keep essential grouping fields
        const group = {
          ...article,
          sources: [article.source],
          descriptions: [article.description],
          links: [{ source: article.source, url: article.link }],
          categories: [article.category],
          pubDates: [article.pubDate],
        };

        const currentTime = article.pubDate.getTime();

        for (const { article: otherArticle, index: otherIndex } of bucket) {
          if (processed.has(otherIndex) || otherIndex <= index) continue;
          const timeDiff = Math.abs(
            otherArticle.pubDate.getTime() - currentTime
          );
          if (timeDiff > timeWindow) continue;

          // Simple title similarity check
          const titleSimilarity = stringSimilarity.compareTwoStrings(
            article.title.toLowerCase(),
            otherArticle.title.toLowerCase()
          );

          if (titleSimilarity >= SIMILARITY_THRESHOLD) {
            group.sources.push(otherArticle.source);
            group.descriptions.push(otherArticle.description);
            group.links.push({
              source: otherArticle.source,
              url: otherArticle.link,
            });
            group.categories.push(otherArticle.category);
            group.pubDates.push(otherArticle.pubDate);

            // Keep longest description
            if (
              otherArticle.description &&
              otherArticle.description.length > group.description.length
            ) {
              group.description = otherArticle.description;
            }
            // Keep first image found
            if (!group.imageUrl && otherArticle.imageUrl) {
              group.imageUrl = otherArticle.imageUrl;
            }
            processed.add(otherIndex);
          }
        }

        // SIMPLIFIED: Only essential metadata
        group.sourceDiversity = group.sources.length;
        group.uniqueCategories = [...new Set(group.categories)];
        group.combinedDescription = group.descriptions.join(" ");

        groups.push(group);
        processed.add(index);
      }
    }

    return groups;
  } catch (error) {
    console.error("Error in deduplicateArticles:", error);
    return articles;
  }
}

// ========== SAVE TO FIRESTORE ==========
async function saveArticlesToFirestore(articles) {
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return { success: true, saved: 0, failed: 0, errors: [] };
  }
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const errors = [];
  let savedCount = 0,
    failedCount = 0;
  try {
    const batchGroups = [];
    let currentBatch = [];

    for (const article of articles) {
      try {
        if (!article || !article.title || !article.pubDate) {
          throw new Error("Invalid article data: missing required fields");
        }
        const docId = generateHash(
          article.title + article.pubDate.toISOString()
        );
        const articleData = {
          ...article,
          pubDate: admin.firestore.Timestamp.fromDate(article.pubDate),
          fetchedAt: timestamp,
          processed: false,
        };
        currentBatch.push({ docId, articleData });
        if (currentBatch.length >= BATCH_SIZE_LIMIT) {
          batchGroups.push([...currentBatch]);
          currentBatch = [];
        }
      } catch (error) {
        console.error(`Error preparing article for batch: ${error.message}`);
        errors.push({ article: article.title, error: error.message });
        failedCount++;
      }
    }
    if (currentBatch.length > 0) batchGroups.push(currentBatch);

    for (let i = 0; i < batchGroups.length; i++) {
      const group = batchGroups[i];
      let retryCount = 0,
        retrySuccess = false;
      while (retryCount < 3 && !retrySuccess) {
        try {
          const batch = db.batch();
          for (const { docId, articleData } of group) {
            batch.set(db.collection("articles").doc(docId), articleData, {
              merge: true,
            });
          }
          await batch.commit();
          savedCount += group.length;
          retrySuccess = true;
          console.log(
            `Successfully committed batch ${i + 1}/${batchGroups.length}`
          );
        } catch (batchError) {
          retryCount++;
          console.error(
            `Batch ${i + 1} attempt ${retryCount} failed:`,
            batchError.message
          );
          if (retryCount < 3) {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
          } else {
            errors.push({
              batch: i + 1,
              error: batchError.message,
              articlesInBatch: group.length,
            });
            failedCount += group.length;
          }
        }
      }
    }

    console.log(
      `Save operation completed: ${savedCount} saved, ${failedCount} failed`
    );
    return {
      success: failedCount === 0,
      saved: savedCount,
      failed: failedCount,
      errors,
    };
  } catch (error) {
    console.error("Critical error in saveArticlesToFirestore:", error);
    return {
      success: false,
      saved: savedCount,
      failed: articles.length - savedCount,
      errors: [...errors, { critical: true, error: error.message }],
    };
  }
}
// ========== AI PROCESSING HELPERS ==========

function shouldAnalyzeDailyImpact(article) {
  // Categories that should get daily impact analysis
  if (article.category === "sports") {
    return false;
  }

  // Process all other categories
  return true;
}
async function processArticleWithAI(article) {
  if (!genAI) {
    console.warn("Gemini API not configured, skipping AI processing");
    return { summary: article.description, dailyLifeImpact: null };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate summary (always)
    const summaryPrompt = `Summarize this news article in 2-3 clear, concise sentences. Focus on the key facts and what happened:

Title: ${article.title}
Content: ${article.combinedDescription || article.description}

Summary:`;

    const summaryResult = await model.generateContent(summaryPrompt);
    const summary = summaryResult.response.text().trim();

    // Generate daily life impact (only if relevant)
    let dailyLifeImpact = null;

    if (shouldAnalyzeDailyImpact(article)) {
      const impactPrompt = `Based on this news, explain in 1-2 simple sentences how it could affect the average person's daily life, finances, health, safety, or routine. Be practical and specific. Only respond with "N/A" if this is purely ceremonial, entertainment, or has absolutely zero relevance to daily life.

Title: ${article.title}
Summary: ${summary}

Daily Life Impact:`;

      const impactResult = await model.generateContent(impactPrompt);
      const impact = impactResult.response.text().trim();

      console.log(`[DEBUG] Article: "${article.title.substring(0, 50)}..."`);
      console.log(`[DEBUG] Impact response: "${impact}"`);

      // Only save if it's not N/A (be less strict)
      if (impact && impact !== "N/A" && impact.length > 5) {
        dailyLifeImpact = impact;
      }
    }

    return { summary, dailyLifeImpact };
  } catch (error) {
    console.error("Error processing article with AI:", error);
    // Fallback to original description
    return { summary: article.description, dailyLifeImpact: null };
  }
}

// ========== CLOUD FUNCTIONS ==========

exports.fetchNewsManual = onRequest(
  { memory: "512MiB", timeoutSeconds: 300 },
  async (req, res) => {
    if (!verifyApiKey(req)) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized - Invalid API key" });
    }
    const operationId = `fetchNewsManual_${Date.now()}`;
    console.log(`Starting manual news fetch operation: ${operationId}`);
    const startTime = Date.now();
    let articlesProcessed = 0,
      articlesSaved = 0,
      errors = [];

    try {
      const allArticles = await fetchAllRSSFeeds();
      articlesProcessed = allArticles.length;
      console.log(`Fetched ${articlesProcessed} articles from RSS feeds`);

      const deduplicatedArticles = deduplicateArticles(allArticles);
      console.log(
        `Deduplicated to ${deduplicatedArticles.length} unique articles`
      );

      const saveResult = await saveArticlesToFirestore(deduplicatedArticles);
      articlesSaved = saveResult.saved;

      if (saveResult.errors && saveResult.errors.length > 0) {
        errors = saveResult.errors;
        console.warn(
          `Firestore save completed with ${saveResult.errors.length} errors`
        );
      }

      const processingTime = Date.now() - startTime;
      console.log(
        `Manual news fetch operation ${operationId} completed in ${processingTime}ms`
      );

      res.json({
        success: true,
        operationId: operationId,
        articlesProcessed: articlesProcessed,
        articlesSaved: articlesSaved,
        duplicatesRemoved: articlesProcessed - deduplicatedArticles.length,
        processingTime: processingTime,
        errors: errors.length > 0 ? errors : undefined,
        message: "News fetched successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in fetchNewsManual:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

exports.getArticles = onRequest(
  { memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const isAllowed = await rateLimiter.isAllowed(clientIp);
    if (!isAllowed) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
      });
    }

    const apiKey = req.headers[API_KEY_HEADER];
    const validApiKey = process.env.API_KEY;
    if (validApiKey && apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid or missing API key",
      });
    }

    try {
      const category = req.query.category || "general";
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);

      let query = db
        .collection("articles")
        .orderBy("pubDate", "desc")
        .limit(limit);

      if (category !== "all") {
        query = query.where("category", "==", category);
      }

      const snapshot = await query.get();
      const articles = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const article = {
          id: doc.id,
          ...data,
          pubDate: data.pubDate?.toDate().toISOString(),
          fetchedAt: data.fetchedAt?.toDate().toISOString(),
        };
        articles.push(article);
      });

      const remaining = await rateLimiter.getRemainingRequests(clientIp);
      res.set("X-RateLimit-Remaining", remaining.toString());
      res.json({ success: true, count: articles.length, articles });
    } catch (error) {
      console.error("Error fetching articles:", error);
      if (error.message && error.message.includes("index")) {
        return res.status(500).json({
          success: false,
          error: "Database index required",
          message:
            "Please create a composite index in Firebase Console: Collection 'articles', Fields: 'category' (Ascending) + 'pubDate' (Descending)",
          indexUrl:
            "https://console.firebase.google.com/project/_/firestore/indexes",
          details: error.message,
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
exports.processArticles = onRequest(
  { memory: "512MiB", timeoutSeconds: 540 },
  async (req, res) => {
    if (!verifyApiKey(req)) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized - Invalid API key" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Gemini API key not configured",
        message: "Set GEMINI_API_KEY environment variable",
      });
    }

    const operationId = `processArticles_${Date.now()}`;
    console.log(`Starting AI processing operation: ${operationId}`);
    const startTime = Date.now();

    try {
      // Find unprocessed articles
      const snapshot = await db
        .collection("articles")
        .where("processed", "==", false)
        .limit(50) // Process 50 at a time to avoid timeouts
        .get();

      if (snapshot.empty) {
        console.log("No unprocessed articles found");
        return res.json({
          success: true,
          processed: 0,
          message: "No articles to process",
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`Found ${snapshot.size} articles to process`);
      let processedCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process articles in batches of 10 to avoid rate limits
      const articles = snapshot.docs;
      const batchSize = 10;

      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (doc) => {
            try {
              const article = doc.data();
              console.log(`Processing: ${article.title}`);

              // Generate AI summary and daily impact
              const { summary, dailyLifeImpact } = await processArticleWithAI(
                article
              );

              // Update Firestore
              await doc.ref.update({
                summary: summary,
                dailyLifeImpact: dailyLifeImpact,
                processed: true,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              processedCount++;
              console.log(`✓ Processed: ${article.title.substring(0, 50)}...`);
            } catch (error) {
              errorCount++;
              errors.push({
                articleId: doc.id,
                error: error.message,
              });
              console.error(
                `✗ Error processing article ${doc.id}:`,
                error.message
              );
            }
          })
        );

        // Wait 2 seconds between batches to respect rate limits
        if (i + batchSize < articles.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(
        `AI processing completed: ${processedCount} processed, ${errorCount} errors in ${processingTime}ms`
      );

      res.json({
        success: true,
        operationId: operationId,
        processed: processedCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
        processingTime: processingTime,
        message: "AI processing completed",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in processArticles:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

exports.cleanupRateLimits = onRequest(
  { memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    if (!verifyApiKey(req)) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized - Invalid API key" });
    }
    console.log("Starting cleanup of old rate limit records");
    try {
      const now = Date.now();
      const snapshot = await db
        .collection(RATE_LIMIT_COLLECTION)
        .where("resetTime", "<", now)
        .limit(500)
        .get();
      if (snapshot.empty) {
        console.log("No old rate limit records to cleanup");
        return res.json({
          success: true,
          deleted: 0,
          message: "No rate limit records to cleanup",
        });
      }
      const batch = db.batch();
      let deleteCount = 0;
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deleteCount++;
      });
      await batch.commit();
      console.log(`Deleted ${deleteCount} old rate limit records`);
      res.json({
        success: true,
        deleted: deleteCount,
        message: `Successfully deleted ${deleteCount} expired rate limit records`,
      });
    } catch (error) {
      console.error("Error in cleanupRateLimits:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

exports.scheduledCleanupOldArticles = onSchedule(
  {
    schedule: "0 4 1 * *", // At 4:00 AM on the 1st of every month
    timeZone: "America/New_York",
    memory: "256MiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    console.log(
      "🧹 Monthly cleanup of old articles started:",
      new Date().toISOString()
    );
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ARTICLE_RETENTION_DAYS);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
      const snapshot = await db
        .collection("articles")
        .where("pubDate", "<", cutoffTimestamp)
        .limit(500)
        .get();
      if (snapshot.empty) {
        console.log("No old articles to delete.");
        return null;
      }
      const batch = db.batch();
      let deleteCount = 0;
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deleteCount++;
      });
      await batch.commit();
      console.log(
        `✅ Deleted ${deleteCount} old articles older than ${ARTICLE_RETENTION_DAYS} days`
      );
      return null;
    } catch (error) {
      console.error("❌ Error during scheduled cleanup:", error);
      return null;
    }
  }
);
