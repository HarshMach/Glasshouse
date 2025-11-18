

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");


if (!admin.apps.length) {
  admin.initializeApp();
}

setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

const db = admin.firestore();


const RSSService = require("./services/rssService");
const AIService = require("./services/aiService");
const ImageService = require("./services/imageService");
const DeduplicationService = require("./services/deduplicationService");
const StorageService = require("./services/storageService");
const { verifyApiKey, getClientIp } = require("./utils/helpers");
const { LIMITS, COLLECTIONS } = require("./config/constants");
const rssService = new RSSService(db);
const storageService = new StorageService(db, admin);

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT;

const UNSPLASH_API_KEY_PARAM = defineString("UNSPLASH_API_KEY");
const PEXELS_API_KEY_PARAM = defineString("PEXELS_API_KEY");
const API_KEY_PARAM = defineString("API_KEY");
const APP_API_KEY_PARAM = defineString("APP_API_KEY");

const UNSPLASH_API_KEY =
  UNSPLASH_API_KEY_PARAM.value() ||
  process.env.UNSPLASH_API_KEY ||
  null;

const PEXELS_API_KEY =
  PEXELS_API_KEY_PARAM.value() ||
  process.env.PEXELS_API_KEY ||
  null;


const API_KEY =
  API_KEY_PARAM.value() ||
  APP_API_KEY_PARAM.value() ||
  process.env.API_KEY ||
  process.env.APP_API_KEY ||
  null;




exports.health = onRequest(
  { memory: "128MiB", timeoutSeconds: 10 },
  async (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    });
  }
);


exports.fetchNews = onRequest(
  { memory: "512MiB", timeoutSeconds: 540 },
  async (req, res) => {
    if (!verifyApiKey(req, API_KEY)) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid API key",
      });
    }

    const operationId = `fetchNews_${Date.now()}`;
    console.log(`Starting news fetch operation: ${operationId}`);
    const startTime = Date.now();

    try {
      
      console.log("Step 1: Fetching from RSS feeds...");
      const allArticles = await rssService.fetchAllArticles();
      console.log(`Fetched ${allArticles.length} articles from RSS feeds`);

      if (allArticles.length === 0) {
        return res.json({
          success: true,
          operationId,
          articlesProcessed: 0,
          articlesSaved: 0,
          message: "No articles fetched",
          processingTime: Date.now() - startTime,
        });
      }

      console.log("Step 2: Deduplicating articles...");
      const deduplicatedArticles =
        DeduplicationService.deduplicateArticles(allArticles);
      console.log(
        `Deduplicated to ${deduplicatedArticles.length} unique articles`
      );

  
      console.log("Step 3: Saving to Firestore...");
      const saveResult = await storageService.saveArticles(
        deduplicatedArticles
      );

      const processingTime = Date.now() - startTime;
      console.log(
        `News fetch operation ${operationId} completed in ${processingTime}ms`
      );

      res.json({
        success: true,
        operationId,
        articlesProcessed: allArticles.length,
        articlesSaved: saveResult.saved,
        duplicatesRemoved: allArticles.length - deduplicatedArticles.length,
        processingTime,
        errors: saveResult.errors.length > 0 ? saveResult.errors : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in fetchNews:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);


exports.processArticles = onRequest(
  { memory: "1GiB", timeoutSeconds: 540 },
  async (req, res) => {
    if (!verifyApiKey(req, API_KEY)) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid API key",
      });
    }

   
    const aiService = new AIService(PROJECT_ID);
    const imageService = new ImageService(UNSPLASH_API_KEY, PEXELS_API_KEY);

    const operationId = `processArticles_${Date.now()}`;
    console.log(`Starting AI processing operation: ${operationId}`);
    const startTime = Date.now();

    try {

     
      const articles = await storageService.getUnprocessedArticles(
        LIMITS.AI_MAX_ARTICLES_PER_RUN
      );

      if (articles.length === 0) {
        console.log("No unprocessed articles found");
        return res.json({
          success: true,
          processed: 0,
          message: "No articles to process",
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`Found ${articles.length} articles to process`);
      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errors = [];


      const batchSize = LIMITS.AI_PROCESSING_BATCH_SIZE;

      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);

        for (const article of batch) {
          try {
            console.log(`Processing: ${article.title.substring(0, 50)}...`);

       
            const aiResult = await aiService.processArticle(article);

            if (!aiResult.shouldPublish) {
              skippedCount++;
              console.log(
                `Skipped low-quality article: ${article.title.substring(
                  0,
                  50
                )}...`
              );

            
              const updateData = {
                processed: true,
                qualityScore: aiResult.qualityScore,
                qualityReason: aiResult.qualityReason,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
              };

          
              if (aiResult.summary) updateData.summary = aiResult.summary;
              if (aiResult.dailyLifeImpact)
                updateData.dailyLifeImpact = aiResult.dailyLifeImpact;
              if (aiResult.category) updateData.category = aiResult.category;

              await article.ref.update(updateData);
              continue;
            }

  
            let imageData = null;
            if (aiResult.imageKeywords) {
              imageData = await imageService.getImageForArticle(
                aiResult.imageKeywords,
                aiResult.category
              );
            }

            await storageService.updateArticleWithAI(
              article.ref,
              aiResult,
              imageData
            );

            processedCount++;
            console.log(` Processed: ${article.title.substring(0, 50)}...`);
          } catch (error) {
            errorCount++;
            errors.push({
              articleId: article.id,
              error: error.message,
            });
            console.error(
              `✗ Error processing article ${article.id}:`,
              error.message
            );
          }
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(
        `AI processing completed: ${processedCount} published, ${skippedCount} skipped, ${errorCount} errors in ${processingTime}ms`
      );

      res.json({
        success: true,
        operationId,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
        processingTime,
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


exports.getArticles = onRequest(
  { memory: "256MiB", timeoutSeconds: 60, cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const category = req.query.category || "all";
      const sortBy = req.query.sortBy || "recent";
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const cursor = req.query.cursor || null;

      const result = await storageService.getArticlesPaginated({
        category,
        sortBy,
        limit,
        cursor,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error in getArticles:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


exports.trackView = onRequest(
  { memory: "128MiB", timeoutSeconds: 10, cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { articleId } = req.body;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: "articleId is required",
        });
      }

      await storageService.incrementViews(articleId);

      res.json({
        success: true,
        message: "View tracked",
      });
    } catch (error) {
      console.error("Error tracking view:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


exports.toggleLike = onRequest(
  { memory: "128MiB", timeoutSeconds: 10, cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { articleId, userId } = req.body;

      if (!articleId || !userId) {
        return res.status(400).json({
          success: false,
          error: "articleId and userId are required",
        });
      }

      const result = await storageService.toggleLike(articleId, userId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


exports.trackShare = onRequest(
  { memory: "128MiB", timeoutSeconds: 10, cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { articleId } = req.body;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: "articleId is required",
        });
      }

      await storageService.incrementShares(articleId);

      res.json({
        success: true,
        message: "Share tracked",
      });
    } catch (error) {
      console.error("Error tracking share:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


exports.addComment = onRequest(
  { memory: "128MiB", timeoutSeconds: 10, cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { articleId, userId, username, text } = req.body;

      if (!articleId || !userId || !username || !text) {
        return res.status(400).json({
          success: false,
          error: "articleId, userId, username, and text are required",
        });
      }

      if (text.length < 1 || text.length > 500) {
        return res.status(400).json({
          success: false,
          error: "Comment must be between 1 and 500 characters",
        });
      }

      const commentId = await storageService.addComment(articleId, {
        userId,
        username,
        text,
      });

      res.json({
        success: true,
        commentId,
        message: "Comment added",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


exports.getComments = onRequest(
  { memory: "128MiB", timeoutSeconds: 30, cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const articleId = req.query.articleId;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: "articleId is required",
        });
      }

      const comments = await storageService.getComments(articleId, limit);

      res.json({
        success: true,
        count: comments.length,
        comments,
      });
    } catch (error) {
      console.error("Error getting comments:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


exports.scheduledFetchNews = onSchedule(
  {
    schedule: "every 2 hours",
    timeZone: "America/New_York",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    console.log("Scheduled news fetch started:", new Date().toISOString());

    try {
      const allArticles = await rssService.fetchAllArticles();
      const deduplicatedArticles =
        DeduplicationService.deduplicateArticles(allArticles);
      const saveResult = await storageService.saveArticles(
        deduplicatedArticles
      );

      console.log(
        `Scheduled fetch complete: ${saveResult.saved} articles saved`
      );
      return null;
    } catch (error) {
      console.error("Error in scheduled fetch:", error);
      return null;
    }
  }
);


exports.scheduledProcessArticles = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: "America/New_York",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (event) => {
   
    const aiService = new AIService(PROJECT_ID);
    const imageService = new ImageService(UNSPLASH_API_KEY, PEXELS_API_KEY);

    console.log(
      " Scheduled AI processing started:",
      new Date().toISOString()
    );

    try {

      const articles = await storageService.getUnprocessedArticles(
        LIMITS.AI_MAX_ARTICLES_PER_RUN
      );

      if (articles.length === 0) {
        console.log("No articles to process");
        return null;
      }

      let processed = 0;
      let skipped = 0;

      for (const article of articles) {
        try {
          const aiResult = await aiService.processArticle(article);

          if (!aiResult.shouldPublish) {
            skipped++;
            await article.ref.update({
              processed: true,
              qualityScore: aiResult.qualityScore,
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            continue;
          }

          let imageData = null;
          if (aiResult.imageKeywords) {
            imageData = await imageService.getImageForArticle(
              aiResult.imageKeywords,
              aiResult.category
            );
          }

          await storageService.updateArticleWithAI(
            article.ref,
            aiResult,
            imageData
          );
          processed++;
        } catch (error) {
          console.error(`Error processing article ${article.id}:`, error);
        }
      }

      console.log(
        ` Scheduled processing complete: ${processed} processed, ${skipped} skipped`
      );
      return null;
    } catch (error) {
      console.error(" Error in scheduled processing:", error);
      return null;
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
    console.log(" Scheduled cleanup started:", new Date().toISOString());

    try {
      const deletedCount = await storageService.deleteOldArticles(
        LIMITS.ARTICLE_RETENTION_DAYS
      );

      console.log(`Cleanup complete: ${deletedCount} old articles deleted`);
      return null;
    } catch (error) {
      console.error(" Error in scheduled cleanup:", error);
      return null;
    }
  }
);
