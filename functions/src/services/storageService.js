/**
 * Storage Service
 * Handles all Firestore database operations
 */

const { COLLECTIONS, LIMITS } = require('../config/constants');
const { generateHash } = require('../utils/helpers');

class StorageService {
  constructor(db, admin) {
    this.db = db;
    this.admin = admin;
  }

  /**
   * Save articles to Firestore in batches
   */
  async saveArticles(articles) {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return { success: true, saved: 0, failed: 0, errors: [] };
    }

    const timestamp = this.admin.firestore.FieldValue.serverTimestamp();
    const errors = [];
    let savedCount = 0;
    let failedCount = 0;

    try {
      const batchGroups = [];
      let currentBatch = [];

      for (const article of articles) {
        try {
          if (!article || !article.title || !article.pubDate) {
            throw new Error('Invalid article data: missing required fields');
          }

          const docId = generateHash(
            article.title + article.pubDate.toISOString()
          );

          const articleData = {
            ...article,
            pubDate: this.admin.firestore.Timestamp.fromDate(article.pubDate),
            fetchedAt: timestamp,
            processed: false,
            // Initialize engagement metrics
            likes: 0,
            shares: 0,
            views: 0,
            commentCount: 0,
          };

          currentBatch.push({ docId, articleData });

          if (currentBatch.length >= LIMITS.BATCH_SIZE) {
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

      // Commit all batches
      for (let i = 0; i < batchGroups.length; i++) {
        const group = batchGroups[i];
        let retryCount = 0;
        let retrySuccess = false;

        while (retryCount < 3 && !retrySuccess) {
          try {
            const batch = this.db.batch();
            for (const { docId, articleData } of group) {
              batch.set(
                this.db.collection(COLLECTIONS.ARTICLES).doc(docId),
                articleData,
                { merge: true }
              );
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
      console.error('Critical error in saveArticles:', error);
      return {
        success: false,
        saved: savedCount,
        failed: articles.length - savedCount,
        errors: [...errors, { critical: true, error: error.message }],
      };
    }
  }

  /**
   * Get unprocessed articles for AI processing
   */
  async getUnprocessedArticles(limit = 50) {
    try {
      const snapshot = await this.db
        .collection(COLLECTIONS.ARTICLES)
        .where('processed', '==', false)
        .limit(limit)
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ref: doc.ref,
        ...doc.data(),
        pubDate: doc.data().pubDate?.toDate(),
      }));
    } catch (error) {
      console.error('Error getting unprocessed articles:', error);
      return [];
    }
  }

  /**
   * Update article with AI processing results
   */
  async updateArticleWithAI(docRef, aiResult, imageData = null) {
    try {
      const updateData = {
        summary: aiResult.summary,
        dailyLifeImpact: aiResult.dailyLifeImpact,
        category: aiResult.category,
        qualityScore: aiResult.qualityScore,
        qualityReason: aiResult.qualityReason,
        processed: true,
        processedAt: this.admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add image data if available
      if (imageData) {
        updateData.stockImage = imageData;
      }

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating article with AI results:', error);
      throw error;
    }
  }

  /**
   * Get articles with filters and pagination
   * Only returns AI-processed, quality articles that have both summary and dailyLifeImpact.
   * Results can be ordered by recency (newest first) or popularity (engagement-based).
   */
  /**
 * Get articles with filters AND real Firestore pagination
 */
async getArticles(options = {}) {
  const {
    category = null,
    sortBy = 'recent',
    limit = 50,
    cursor = null, // renamed from startAfter for clarity
  } = options;

  try {
    let query = this.db
      .collection(COLLECTIONS.ARTICLES)
      .where('processed', '==', true);

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    // Base order for pagination
    query = query.orderBy('pubDate', 'desc');

    // Apply pagination cursor
    if (cursor) {
      const lastDoc = await this.db
        .collection(COLLECTIONS.ARTICLES)
        .doc(cursor)
        .get();

      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    // Overfetch so AI filters don’t reduce results
    query = query.limit(limit * 2);

    const snapshot = await query.get();
    const rawDocs = snapshot.docs;

    const articles = [];

    for (const doc of rawDocs) {
      const data = doc.data();

      // Skip invalid content
      if (!data.summary) continue;
      if (data.category?.toLowerCase() === 'sports') continue;

      articles.push({
        id: doc.id,
        ...data,
        pubDate: data.pubDate?.toDate().toISOString(),
        fetchedAt: data.fetchedAt?.toDate().toISOString(),
        processedAt: data.processedAt?.toDate().toISOString(),
      });

      // Stop once clean limit reached
      if (articles.length >= limit) break;
    }

    // Sorting logic
    if (sortBy === 'popular') {
      articles.sort((a, b) => {
        const engagementA =
          (a.likes || 0) * 3 +
          (a.commentCount || 0) * 2 +
          (a.views || 0) * 0.1;

        const engagementB =
          (b.likes || 0) * 3 +
          (b.commentCount || 0) * 2 +
          (b.views || 0) * 0.1;

        return engagementB - engagementA;
      });
    } else {
      articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    }

    // Determine next cursor
    const lastVisibleDoc = rawDocs[rawDocs.length - 1];
    const nextCursor = lastVisibleDoc ? lastVisibleDoc.id : null;

    return {
      articles,
      nextCursor,
    };

  } catch (error) {
    console.error('Error getting articles:', error);
    throw error;
  }
}
/**
 * Get articles with proper pagination support
 * This is the public-facing method that should be called from the API endpoint
 */
async getArticlesPaginated({ category = 'all', sortBy = 'recent', limit = 20, cursor = null } = {}) {
  try {
    const articles = [];
    let lastDoc = cursor ? await this.db.collection(COLLECTIONS.ARTICLES).doc(cursor).get() : null;
    let keepFetching = true;

    while (keepFetching && articles.length < limit) {
      let query = this.db
        .collection(COLLECTIONS.ARTICLES)
        .where('processed', '==', true)
        .orderBy('pubDate', 'desc')
        .limit(limit * 2); // Overfetch

      if (category && category !== 'all') {
        query = query.where('category', '==', category);
      }

      if (lastDoc && lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) break;

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Skip invalid articles
        if (!data.summary || data.category?.toLowerCase() === 'sports') continue;

        articles.push({
          id: doc.id,
          ...data,
          pubDate: data.pubDate?.toDate().toISOString(),
          fetchedAt: data.fetchedAt?.toDate().toISOString(),
          processedAt: data.processedAt?.toDate().toISOString(),
        });

        if (articles.length >= limit) break;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      // Stop fetching if no more documents
      if (!lastDoc || snapshot.docs.length === 0) keepFetching = false;
    }

    // Sort by popularity if requested
    if (sortBy === 'popular') {
      articles.sort((a, b) => {
        const engagementA = (a.likes || 0) * 3 + (a.commentCount || 0) * 2 + (a.views || 0) * 0.1;
        const engagementB = (b.likes || 0) * 3 + (b.commentCount || 0) * 2 + (b.views || 0) * 0.1;
        return engagementB - engagementA;
      });
    }

    const nextCursor = lastDoc && articles.length >= limit ? lastDoc.id : null;

    return {
      articles,
      nextCursor,
      hasMore: !!nextCursor,
      count: articles.length,
    };

  } catch (error) {
    console.error('Error getting paginated articles:', error);
    throw error;
  }
}


  /**
   * Search articles with fuzzy matching
   * Searches across title, category, and summary, tolerant to typos.
   */
  async searchArticles(searchQuery, limit = 50) {
    try {
      const snapshot = await this.db
        .collection(COLLECTIONS.ARTICLES)
        .where('processed', '==', true)
        .orderBy('pubDate', 'desc')
        .limit(limit * 3) // overfetch; we'll trim after fuzzy filtering
        .get();

      const allArticles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        pubDate: doc.data().pubDate?.toDate().toISOString(),
      }));

      const query = searchQuery.toLowerCase();

      const filtered = allArticles.filter((article) => {
        // Only consider articles that have a summary (matches getArticles logic)
        // Also filter out sports articles
        if (!article.summary || article.category?.toLowerCase() === 'sports') return false;

        const title = article.title || '';
        const category = article.category || '';
        const summary = article.summary || '';
        const dailyLifeImpact = article.dailyLifeImpact || '';

        // Basic substring matches first (fast path)
        const titleMatch = title.toLowerCase().includes(query);
        const categoryMatch = category.toLowerCase().includes(query);
        const summaryMatch = summary.toLowerCase().includes(query);
        const impactMatch = dailyLifeImpact.toLowerCase().includes(query);

        if (titleMatch || categoryMatch || summaryMatch || impactMatch) {
          return true;
        }

        // Fuzzy match as a slower fallback for typos
        const { fuzzyMatch } = require('../utils/helpers');
        const fuzzyTitle = fuzzyMatch(query, title, 0.7);
        const fuzzyCategory = fuzzyMatch(query, category, 0.7);
        const fuzzySummary = fuzzyMatch(query, summary, 0.75);
        const fuzzyImpact = fuzzyMatch(query, dailyLifeImpact, 0.75);

        return fuzzyTitle || fuzzyCategory || fuzzySummary || fuzzyImpact;
      });

      // Sort by most recent first
      filtered.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(articleId) {
    try {
      await this.db
        .collection(COLLECTIONS.ARTICLES)
        .doc(articleId)
        .update({
          views: this.admin.firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  /**
   * Toggle like on article
   */
  async toggleLike(articleId, userId) {
    try {
      const articleRef = this.db.collection(COLLECTIONS.ARTICLES).doc(articleId);
      const article = await articleRef.get();

      if (!article.exists) {
        throw new Error('Article not found');
      }

      const data = article.data();
      const likedBy = data.likedBy || [];
      const isLiked = likedBy.includes(userId);

      if (isLiked) {
        // Unlike
        await articleRef.update({
          likes: this.admin.firestore.FieldValue.increment(-1),
          likedBy: this.admin.firestore.FieldValue.arrayRemove(userId),
        });
        return { liked: false, likes: (data.likes || 0) - 1 };
      } else {
        // Like
        await articleRef.update({
          likes: this.admin.firestore.FieldValue.increment(1),
          likedBy: this.admin.firestore.FieldValue.arrayUnion(userId),
        });
        return { liked: true, likes: (data.likes || 0) + 1 };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Increment share count
   */
  async incrementShares(articleId) {
    try {
      await this.db
        .collection(COLLECTIONS.ARTICLES)
        .doc(articleId)
        .update({
          shares: this.admin.firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error('Error incrementing shares:', error);
    }
  }

  /**
   * Add comment to article
   */
  async addComment(articleId, comment) {
    try {
      const commentRef = await this.db.collection(COLLECTIONS.COMMENTS).add({
        articleId,
        ...comment,
        createdAt: this.admin.firestore.FieldValue.serverTimestamp(),
        reported: false,
      });

      // Increment comment count on article
      await this.db
        .collection(COLLECTIONS.ARTICLES)
        .doc(articleId)
        .update({
          commentCount: this.admin.firestore.FieldValue.increment(1),
        });

      return commentRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for article
   */
  async getComments(articleId, limit = 50) {
    try {
      const snapshot = await this.db
        .collection(COLLECTIONS.COMMENTS)
        .where('articleId', '==', articleId)
        .where('reported', '==', false) // Don't show reported comments
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
      }));
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Report content (article or comment)
   */
  async reportContent(contentType, contentId, reason, reportedBy) {
    try {
      await this.db.collection(COLLECTIONS.REPORTS).add({
        contentType, // 'article' or 'comment'
        contentId,
        reason,
        reportedBy,
        createdAt: this.admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
      });

      console.log(`Content reported: ${contentType} ${contentId}`);
    } catch (error) {
      console.error('Error reporting content:', error);
      throw error;
    }
  }

  /**
   * Delete old articles
   */
  async deleteOldArticles(retentionDays) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffTimestamp = this.admin.firestore.Timestamp.fromDate(cutoffDate);

      const snapshot = await this.db
        .collection(COLLECTIONS.ARTICLES)
        .where('pubDate', '<', cutoffTimestamp)
        .limit(500)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = this.db.batch();
      let deleteCount = 0;

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      await batch.commit();
      return deleteCount;
    } catch (error) {
      console.error('Error deleting old articles:', error);
      return 0;
    }
  }
}

module.exports = StorageService;
