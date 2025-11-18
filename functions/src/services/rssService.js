

const Parser = require('rss-parser');
const { RSS_SOURCES, LIMITS, CIRCUIT_BREAKER, COLLECTIONS } = require('../config/constants');
const { isValidRSSUrl, isValidUrl, sanitizeRSSItem, cleanText, extractImageUrl, generateHash, delay } = require('../utils/helpers');

class RSSService {
  constructor(db) {
    this.db = db;
    this.parser = new Parser();
  }

  
  async shouldSkipSource(sourceName) {
    try {
      const stateDoc = await this.db
        .collection(COLLECTIONS.CIRCUIT_BREAKER)
        .doc(sourceName)
        .get();
      
      if (!stateDoc.exists) return false;
      
      const state = stateDoc.data();
      const now = Date.now();
      
      if (state.state === 'open') {
        if (now - state.lastFailure > CIRCUIT_BREAKER.TIMEOUT_MS) {
          await this.db.collection(COLLECTIONS.CIRCUIT_BREAKER).doc(sourceName).update({
            state: 'half-open',
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


  async recordSourceFailure(sourceName) {
    try {
      const stateRef = this.db.collection(COLLECTIONS.CIRCUIT_BREAKER).doc(sourceName);
      const stateDoc = await stateRef.get();
      const now = Date.now();
      
      let state = { count: 0, lastFailure: 0, state: 'closed' };
      if (stateDoc.exists) state = stateDoc.data();
      
      state.count++;
      state.lastFailure = now;
      
      if (state.count >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
        state.state = 'open';
        console.log(`Circuit breaker opened for ${sourceName} after ${state.count} failures`);
      }
      
      await stateRef.set(state, { merge: true });
    } catch (error) {
      console.error(`Error recording failure for ${sourceName}:`, error);
    }
  }

 
  async recordSourceSuccess(sourceName) {
    try {
      const stateRef = this.db.collection(COLLECTIONS.CIRCUIT_BREAKER).doc(sourceName);
      const stateDoc = await stateRef.get();
      
      if (stateDoc.exists && stateDoc.data().state === 'half-open') {
        await stateRef.set({ state: 'closed', count: 0 }, { merge: true });
        console.log(`Circuit breaker closed for ${sourceName}`);
      }
    } catch (error) {
      console.error(`Error recording success for ${sourceName}:`, error);
    }
  }

 
  async fetchFromSource(source) {
    if (await this.shouldSkipSource(source.name)) {
      return [];
    }

    if (!isValidRSSUrl(source.url)) {
      console.warn(`Invalid RSS URL for ${source.name}: ${source.url}`);
      await this.recordSourceFailure(source.name);
      return [];
    }

    try {
      console.log(`Fetching from ${source.name}...`);
      
      const feed = await Promise.race([
        this.parser.parseURL(source.url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RSS feed timeout')), 30000)
        ),
      ]);

      if (!feed || !feed.items || !Array.isArray(feed.items)) {
        throw new Error('Invalid feed response structure');
      }

      const articles = [];
      let validArticles = 0;

      for (const item of feed.items) {
        try {
          const sanitizedItem = sanitizeRSSItem(item);
          
          const article = {
            title: sanitizedItem.title?.trim() || '',
            description: cleanText(
              sanitizedItem.contentSnippet ||
                sanitizedItem.description ||
                sanitizedItem.content ||
                ''
            ),
            link: sanitizedItem.link || '',
            pubDate: sanitizedItem.pubDate
              ? new Date(sanitizedItem.pubDate)
              : new Date(),
            source: source.name,
            category: source.category,
            imageUrl: extractImageUrl(sanitizedItem),
            originalId: generateHash(
              sanitizedItem.link || sanitizedItem.title || ''
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

      await this.recordSourceSuccess(source.name);
      console.log(
        `✓ Fetched ${validArticles}/${feed.items.length} valid articles from ${source.name}`
      );
      
      return articles;
    } catch (error) {
      await this.recordSourceFailure(source.name);
      console.error(`✗ Error fetching ${source.name}:`, error.message);
      return [];
    }
  }


  async fetchAllArticles() {
    const allArticles = [];
    const startTime = Date.now();
    const batchSize = LIMITS.RSS_FETCH_BATCH_SIZE;
    
    let processedSources = 0;
    let failedSources = 0;
    let skippedSources = 0;

    for (let i = 0; i < RSS_SOURCES.length; i += batchSize) {
      if (Date.now() - startTime > LIMITS.MAX_PROCESSING_TIME) {
        console.warn('Processing time limit reached, stopping RSS feed processing');
        break;
      }

      const batch = RSS_SOURCES.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          RSS_SOURCES.length / batchSize
        )} with ${batch.length} sources`
      );

      const batchResults = await Promise.allSettled(
        batch.map((source) => this.fetchFromSource(source))
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          if (result.value.length === 0) {
            skippedSources++;
          } else {
            processedSources++;
          }
          allArticles.push(...result.value);
        } else {
          failedSources++;
        }
      });

      
      if (i + batchSize < RSS_SOURCES.length) {
        await delay(1000);
      }
    }

    console.log(
      `RSS feed processing completed: ${processedSources} processed, ${failedSources} failed, ${skippedSources} skipped, ${allArticles.length} total articles`
    );
    
    return allArticles;
  }
}

module.exports = RSSService;
