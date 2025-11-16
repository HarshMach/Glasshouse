/**
 * AI Service - Enhanced with quality filtering and better prompts
 * Uses Gemini API with rate limiting and smart categorization
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AI_CONFIG, RATE_LIMITING, CATEGORIES } = require('../config/constants');
const { delay, extractKeywords } = require('../utils/helpers');

class AIService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: AI_CONFIG.MODEL_NAME });
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }

  /**
   * Rate limit AI requests to stay within free tier
   */
  async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Reset counter every minute
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
    }
    
    // If we're at the limit, wait
    if (this.requestCount >= RATE_LIMITING.GEMINI_REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - timeSinceLastRequest;
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await delay(waitTime);
      this.requestCount = 0;
    }
    
    // Delay between requests to avoid bursting
    await delay(RATE_LIMITING.GEMINI_DELAY_MS);
    
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Evaluate article quality - returns score 1-10 and reasoning
   */
  async evaluateArticleQuality(article) {
    try {
      await this.rateLimitDelay();

      const prompt = `You are a news quality evaluator. Rate this article on a scale of 1-10 based on:
- Newsworthiness and relevance (is it actually news?)
- Clarity and completeness of information
- Significance to readers' daily lives
- NOT celebrity gossip, clickbait, or purely promotional content

Title: ${article.title}
Description: ${article.description}

Respond ONLY with a number from 1-10, followed by a colon and one short sentence explaining why.
Example: "7: Important economic policy change affecting consumers."

Your rating:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      // Parse response (e.g., "7: Significant policy change")
      const match = response.match(/^(\d+):\s*(.+)$/);
      if (match) {
        const score = parseInt(match[1]);
        const reason = match[2];
        return { score, reason, shouldProcess: score >= AI_CONFIG.MIN_ARTICLE_QUALITY_SCORE };
      }
      
      // Fallback if parsing fails
      console.warn(`Could not parse quality score: ${response}`);
      return { score: 5, reason: 'Could not evaluate', shouldProcess: true };
    } catch (error) {
      console.error('Error evaluating article quality:', error);
      return { score: 5, reason: 'Evaluation error', shouldProcess: true };
    }
  }

  /**
   * Detect the best category for an article using AI
   */
  async detectCategory(article) {
    try {
      await this.rateLimitDelay();

      const categoryList = Object.values(CATEGORIES).join(', ');
      const prompt = `Classify this news article into ONE of these categories: ${categoryList}

Title: ${article.title}
Description: ${article.description}

Respond with ONLY the category name, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const detectedCategory = result.response.text().trim().toLowerCase();
      
      // Validate that it's a real category
      if (Object.values(CATEGORIES).includes(detectedCategory)) {
        return detectedCategory;
      }
      
      // Fall back to original category
      return article.category || CATEGORIES.GENERAL;
    } catch (error) {
      console.error('Error detecting category:', error);
      return article.category || CATEGORIES.GENERAL;
    }
  }

  /**
   * Generate summary AND an image prompt in a single AI call.
   * Returns { summary, imagePrompt }.
   */
  async generateSummaryAndImagePrompt(article) {
    try {
      await this.rateLimitDelay();

      const prompt = `You are a professional news summarizer and visual editor for "The GlassHouse" - a news platform that provides clear, actionable insights.

Your tasks:
1) Write a clear, neutral 2-3 sentence summary covering:
   - What happened (key facts and events)
   - Who is involved (key people, organizations, or groups)
   - When and where it occurred
   - Why it matters

2) Propose a SHORT image prompt (3-10 words) for a representative photo or illustration that would fit this article. The image prompt should be concrete and visual (e.g., "shoppers browsing thrift store clothing racks"), not abstract (avoid generic words like "concept" or "metaphor").

Respond ONLY with valid JSON in this format (no markdown, no extra text):
{
  "summary": "...",
  "imagePrompt": "..."
}

Title: ${article.title}
Source: ${article.source}
Category: ${article.category}
Content: ${article.combinedDescription || article.description}
`;

      const result = await this.model.generateContent(prompt);
      let raw = result.response.text().trim();

      // Strip markdown fences if the model added them
      raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseError) {
        console.warn('Could not parse JSON from summary/imagePrompt response:', raw);
        // Fallback: treat whole text as summary, no imagePrompt
        const fallbackSummary = raw.length > AI_CONFIG.SUMMARY_MAX_LENGTH
          ? raw.substring(0, AI_CONFIG.SUMMARY_MAX_LENGTH) + '...'
          : raw;
        return { summary: fallbackSummary, imagePrompt: null };
      }

      let summary = (parsed.summary || '').trim();
      let imagePrompt = (parsed.imagePrompt || '').trim();

      if (!summary) {
        summary = article.description || article.combinedDescription || article.title || '';
      }

      if (summary.length > AI_CONFIG.SUMMARY_MAX_LENGTH) {
        summary = summary.substring(0, AI_CONFIG.SUMMARY_MAX_LENGTH) + '...';
      }

      if (!imagePrompt || imagePrompt.length < 3) {
        imagePrompt = null;
      }

      return { summary, imagePrompt };
    } catch (error) {
      console.error('Error generating summary and image prompt:', error);
      return {
        summary: article.description || article.combinedDescription || article.title || '',
        imagePrompt: null,
      };
    }
  }

  /**
   * Generate comprehensive daily life impact analysis
   */
  async generateDailyImpact(article, summary) {
    try {
      await this.rateLimitDelay();

      const prompt = `You are an analyst for "The GlassHouse" explaining how news affects everyday people.

Based on this news article, explain in 2-3 practical sentences how it could impact someone's daily life. Consider:

**Financial Impact**: Changes to costs, taxes, savings, employment, investments
**Health & Safety**: Public health, food safety, environment, personal security
**Rights & Access**: Laws, regulations, services, freedoms, opportunities
**Practical Changes**: Daily routines, travel, work, shopping, technology use
**Local Effects**: How this might ripple down to communities and individuals

Be SPECIFIC and PRACTICAL. Use concrete examples when possible.

If the news has NO meaningful impact on daily life (e.g., pure entertainment, ceremonial events), respond with exactly: "N/A"

Title: ${article.title}
Category: ${article.category}
Summary: ${summary}

Daily Life Impact:`;

      const result = await this.model.generateContent(prompt);
      let impact = result.response.text().trim();
      
      // Check if it's N/A or too short
      if (impact === 'N/A' || impact.length < 10) {
        return null;
      }
      
      // Ensure impact isn't too long
      if (impact.length > AI_CONFIG.IMPACT_MAX_LENGTH) {
        impact = impact.substring(0, AI_CONFIG.IMPACT_MAX_LENGTH) + '...';
      }
      
      return impact;
    } catch (error) {
      console.error('Error generating daily impact:', error);
      return null;
    }
  }

  /**
   * Generate search keywords for stock image
   */
  async generateImageKeywords(article) {
    try {
      // Quick extraction without AI to save quota
      const keywords = extractKeywords(article.title, 3);
      
      // Add category as context
      if (article.category && article.category !== 'general') {
        keywords.push(article.category);
      }
      
      return keywords.slice(0, 3).join(' ');
    } catch (error) {
      console.error('Error generating image keywords:', error);
      return article.category || 'news';
    }
  }

  /**
   * Process a complete article with all AI enhancements
   */
  async processArticle(article) {
    const result = {
      shouldPublish: false,
      qualityScore: 0,
      qualityReason: '',
      category: article.category,
      summary: null,
      dailyLifeImpact: null,
      imageKeywords: null,
    };

    try {
      // Step 1: Evaluate quality
      console.log(`Evaluating quality: ${article.title.substring(0, 50)}...`);
      const qualityCheck = await this.evaluateArticleQuality(article);
      result.qualityScore = qualityCheck.score;
      result.qualityReason = qualityCheck.reason;

      if (!qualityCheck.shouldProcess) {
        console.log(`❌ Skipping low-quality article (score: ${qualityCheck.score}): ${article.title}`);
        return result;
      }

      // Step 2: Detect better category
      console.log(`Detecting category: ${article.title.substring(0, 50)}...`);
      result.category = await this.detectCategory(article);

      // Step 3: Generate summary + image prompt in a single call
      console.log(`Generating summary and image prompt: ${article.title.substring(0, 50)}...`);
      const { summary, imagePrompt } = await this.generateSummaryAndImagePrompt({
        ...article,
        category: result.category,
      });
      result.summary = summary;

      // Step 4: Generate daily life impact (skip for sports/entertainment unless significant)
      if (result.qualityScore >= 6 || !['sports', 'entertainment'].includes(result.category)) {
        console.log(`Generating impact: ${article.title.substring(0, 50)}...`);
        result.dailyLifeImpact = await this.generateDailyImpact(
          { ...article, category: result.category },
          result.summary
        );
      }

      // Step 5: Generate image keywords (prefer imagePrompt if available)
      if (imagePrompt) {
        result.imageKeywords = imagePrompt;
      } else {
        result.imageKeywords = await this.generateImageKeywords({
          ...article,
          category: result.category,
        });
      }

      // Mark as ready to publish
      result.shouldPublish = true;
      console.log(`✅ Article processed successfully: ${article.title.substring(0, 50)}...`);

      return result;
    } catch (error) {
      console.error(`Error processing article "${article.title}":`, error);
      return result;
    }
  }
}

module.exports = AIService;
