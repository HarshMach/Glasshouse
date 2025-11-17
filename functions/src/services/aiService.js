const { GoogleGenerativeAI } = require("@google/generative-ai");

const { AI_CONFIG, RATE_LIMITING, CATEGORIES } = require("../config/constants");
const { delay, cleanHtml } = require("../utils/helpers");

class AIService {
  // projectId/location kept for backward compatibility; Gemini API key controls billing project
  constructor(projectId, location = "global", temperature = 0.5) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY or GOOGLE_API_KEY env var is required for AIService"
      );
    }

    console.log("🚀 Initializing Gemini API client");

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // Gemini API model name
      generationConfig: {
        temperature: temperature,
      },
    });

    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }
  async rateLimitDelay() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    // Reset minute counter if needed
    if (elapsed > 60000) this.requestCount = 0;

    // Paid Tier 1: 2,000 RPM
    if (this.requestCount >= 2000) {
      const waitTime = 60000 - elapsed;
      console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
      await delay(waitTime);
      this.requestCount = 0;
    }

    await delay(500);
    this.requestCount++;
    this.lastRequestTime = Date.now();
    console.log(`📊 Vertex AI usage: ${this.requestCount}/2000 per minute`);
  }
  async detectCategory(article) {
    try {
      await this.rateLimitDelay();

      const categoryList = Object.values(CATEGORIES).join(", ");
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
      console.error("Error detecting category:", error);
      return article.category || CATEGORIES.GENERAL;
    }
  }

  async generateSummaryAndImagePrompt(article) {
    try {
      await this.rateLimitDelay();
      const content = cleanHtml(
        article.combinedDescription || article.description
      );
      // FREE external context

      const prompt = `You are a professional news summarizer and visual editor for "The GlassHouse" - a news platform that provides clear, actionable insights.
Use:
1. The article content to summarize the news but DO NOT repeat the words  


=== ARTICLE CONTENT ===
${content}




Your tasks:
1) Write a clear, neutral summary covering:
   - What happened (key facts and events)
   - Who is involved (key people, organizations, or groups)
   - When and where it occurred
   - Why it matters
2) DO NOT copy phrases or sentences from the original article. Always rewrite in new wording.
3) Avoid filler like "Continue reading" or attribution text.

4) Propose a SHORT image prompt (3-10 words) for a representative photo or illustration that would fit this article. The image prompt should be concrete and visual (e.g., "shoppers browsing thrift store clothing racks"), not abstract (avoid generic words like "concept" or "metaphor").


Respond ONLY with valid JSON in this format (no markdown, no extra text):
{
  "summary": "...",
  "imagePrompt": "..."
}

Title: ${article.title}
Source: ${article.source}
Category: ${article.category}
Content: ${content}
`;

      const result = await this.model.generateContent(prompt);
      let raw = result.response.text().trim();

      // Strip markdown fences if the model added them
      raw = raw
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseError) {
        console.warn(
          "Could not parse JSON from summary/imagePrompt response:",
          raw
        );
        // Fallback: treat whole text as summary, no imagePrompt
        const fallbackSummary =
          raw.length > AI_CONFIG.SUMMARY_MAX_LENGTH
            ? raw.substring(0, AI_CONFIG.SUMMARY_MAX_LENGTH) + "..."
            : raw;
        return { summary: fallbackSummary, imagePrompt: null };
      }

      let summary = (parsed.summary || "").trim();
      let imagePrompt = (parsed.imagePrompt || "").trim();

      if (!summary) {
        summary =
          article.description ||
          article.combinedDescription ||
          article.title ||
          "";
      }

      if (summary.length > AI_CONFIG.SUMMARY_MAX_LENGTH) {
        summary = summary.substring(0, AI_CONFIG.SUMMARY_MAX_LENGTH) + "...";
      }

      if (!imagePrompt || imagePrompt.length < 3) {
        imagePrompt = null;
      }

      return { summary, imagePrompt };
    } catch (error) {
      console.error("Error generating summary and image prompt:", error);
      return {
        summary:
          article.description ||
          article.combinedDescription ||
          article.title ||
          "",
        imagePrompt: null,
      };
    }
  }

  async generateDailyImpact(article, summary) {
    try {
      await this.rateLimitDelay();

      let prompt = `You are an expert news analyst. Generate a **concise but comprehensive daily life impact** for readers.
      
1) Describe practical effects on people's day-to-day life: finances, routines, safety, rights, and access.
2) If no direct impact exists, analyze **secondary/global consequences**: e.g., economy, inflation, humanitarian effects.
3) Be specific and actionable. Avoid echoing the summary.
4) Use examples: e.g., "Gaza ceasefire may temporarily reduce local violence, but humanitarian aid delays could affect food prices and services."

Title: ${article.title}
Category: ${article.category}
Summary: ${summary}

Provide 2-3 sentences of impact. If truly irrelevant, respond "N/A".`;

      let result = await this.model.generateContent(prompt);
      let impact = result.response.text().trim();

      // If output is too short or N/A, attempt secondary analysis
      if (!impact || impact === "N/A" || impact.length < 10) {
        console.log(`Generating secondary/global impact for: ${article.title}`);
        prompt = `The previous article had no direct daily impact. Analyze potential indirect impacts:
- Economic: prices, inflation, employment, investment
- Social & humanitarian: health, safety, displacement
- Political: policy changes, international relations
Be concise, 2-3 sentences.`;

        result = await this.model.generateContent(prompt);
        impact = result.response.text().trim();
      }

      if (!impact || impact.length < 10) return null;
      if (impact.length > AI_CONFIG.IMPACT_MAX_LENGTH) {
        impact = impact.substring(0, AI_CONFIG.IMPACT_MAX_LENGTH) + "...";
      }

      return impact;
    } catch (error) {
      console.error("Error generating daily impact:", error);
      return null;
    }
  }

  /**
   * Validation function: ensures summary and daily impact aren't just repeating description
   */
  validateSummaryAndImpact(article, summary, impact) {
    const description = (article.description || "").toLowerCase();
    const sumLower = (summary || "").toLowerCase();
    const impactLower = (impact || "").toLowerCase();

    const summaryRepeats =
      description.includes(sumLower) || sumLower.includes(description);
    const impactRepeats =
      description.includes(impactLower) || impactLower.includes(description);

    return {
      summaryValid: !summaryRepeats,
      impactValid: !impactRepeats,
    };
  }
  async evaluateArticleQuality(article) {
    try {
      await this.rateLimitDelay();

      const prompt = `You are a news quality evaluator for "The GlassHouse." Rate this article on a scale of 1-10 considering:

1) Newsworthiness: Is it relevant and significant for readers today?
2) Clarity: Clear and complete information?
3) Daily impact: How it affects everyday people directly or indirectly (financially, socially, politically, or globally).
4) Avoid: Pure gossip, clickbait, entertainment-only, or promotional content.

Title: ${article.title}
Description: ${article.description}

**Important**: If the article has indirect/global effects (e.g., economic impact, humanitarian consequences, political ramifications), consider that in your rating.

Respond ONLY with a number 1-10, followed by a colon and a short sentence explaining why.
Example: "8: Economic sanctions may affect imports, impacting daily prices for consumers." 

Your rating:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();

      const match = response.match(/^(\d+):\s*(.+)$/);
      if (match) {
        const score = parseInt(match[1]);
        const reason = match[2];

        return {
          score,
          reason,
          shouldProcess: score >= AI_CONFIG.MIN_ARTICLE_QUALITY_SCORE,
        };
      }

      console.warn(`Could not parse quality score: ${response}`);
      return { score: 5, reason: "Could not evaluate", shouldProcess: true };
    } catch (error) {
      if (error.message === "Daily quota exceeded") {
        console.warn(
          "⚠️ Gemini API daily quota exceeded - using fallback quality evaluation"
        );
        return {
          score: 5,
          reason: "API quota exceeded - manual review needed",
          shouldProcess: true,
        };
      }
      console.error("Error evaluating article quality:", error);
      return {
        score: 5,
        reason: "Evaluation error - manual review needed",
        shouldProcess: true,
      };
    }
  }

  // processArticle() can call validateSummaryAndImpact before sending to DB
  async processArticle(article) {
    const result = {
      shouldPublish: false,
      qualityScore: 0,
      qualityReason: "",
      category: article.category,
      summary: null,
      dailyLifeImpact: null,
      imageKeywords: null,
    };

    try {
      const qualityCheck = await this.evaluateArticleQuality(article);
      result.qualityScore = qualityCheck.score;
      result.qualityReason = qualityCheck.reason;
      if (!qualityCheck.shouldProcess) return result;

      result.category = await this.detectCategory(article);
      const { summary, imagePrompt } = await this.generateSummaryAndImagePrompt(
        { ...article, category: result.category }
      );
      result.summary = summary;

      result.dailyLifeImpact = await this.generateDailyImpact(
        { ...article, category: result.category },
        summary
      );

      // Validate summary & impact
      const validation = this.validateSummaryAndImpact(
        article,
        summary,
        result.dailyLifeImpact
      );
      if (!validation.summaryValid)
        console.warn(`Summary may echo description: ${article.title}`);
      if (!validation.impactValid)
        console.warn(`Daily impact may echo description: ${article.title}`);

      result.imageKeywords = imagePrompt;
      result.shouldPublish = true;

      return result;
    } catch (error) {
      console.error(`Error processing article "${article.title}":`, error);
      return result;
    }
  }
}
module.exports = AIService;
