/**
 * Deduplication Service
 * Merges similar articles from different sources
 */

const stringSimilarity = require('string-similarity');
const { DEDUPLICATION } = require('../config/constants');
const { extractKeywords } = require('../utils/helpers');

class DeduplicationService {
  /**
   * Deduplicate articles by grouping similar ones
   */
  static deduplicateArticles(articles) {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return [];
    }

    try {
      // Sort by date (newest first)
      const sortedArticles = [...articles].sort((a, b) => b.pubDate - a.pubDate);

      // Create buckets based on keywords for faster matching
      const buckets = new Map();
      const timeWindow = DEDUPLICATION.TIME_WINDOW_HOURS * 60 * 60 * 1000;

      sortedArticles.forEach((article, index) => {
        const keywords = extractKeywords(article.title, 3)
          .slice(0, 3)
          .sort()
          .join('');
        const bucket = buckets.get(keywords) || [];
        bucket.push({ article, index });
        buckets.set(keywords, bucket);
      });

      const groups = [];
      const processed = new Set();

      // Process each bucket
      for (const [bucketKey, bucket] of buckets) {
        for (const { article, index } of bucket) {
          if (processed.has(index)) continue;

          // Create a new group with this article
          const group = {
            ...article,
            sources: [article.source],
            descriptions: [article.description],
            links: [{ source: article.source, url: article.link }],
            categories: [article.category],
            pubDates: [article.pubDate],
          };

          const currentTime = article.pubDate.getTime();

          // Find similar articles in the same bucket
          for (const { article: otherArticle, index: otherIndex } of bucket) {
            if (processed.has(otherIndex) || otherIndex <= index) continue;

            const timeDiff = Math.abs(
              otherArticle.pubDate.getTime() - currentTime
            );
            if (timeDiff > timeWindow) continue;

            // Calculate title similarity
            const titleSimilarity = stringSimilarity.compareTwoStrings(
              article.title.toLowerCase(),
              otherArticle.title.toLowerCase()
            );

            if (titleSimilarity >= DEDUPLICATION.SIMILARITY_THRESHOLD) {
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

          // Add metadata
          group.sourceDiversity = group.sources.length;
          group.uniqueCategories = [...new Set(group.categories)];
          group.combinedDescription = group.descriptions.join(' ');

          groups.push(group);
          processed.add(index);
        }
      }

      console.log(`Deduplicated ${articles.length} articles into ${groups.length} groups`);
      return groups;
    } catch (error) {
      console.error('Error in deduplicateArticles:', error);
      return articles;
    }
  }
}

module.exports = DeduplicationService;
