// testAIService.js
import AIService from '../services/aiService.js';
const functions = require('firebase-functions');

// Replace with your real Gemini API key
const apiKey = functions.config().gemini?.key;

async function test() {
  if (!apiKey) {
    console.error('Please set GEMINI_API_KEY in your environment variables.');
    process.exit(1);
  }

  const ai = new AIService(apiKey);

  // Example test article
  const article = {
    title: 'Caribbean reparations leaders in ‘historic’ first UK visit to press for justice',
    description: 'Caribbean reparations leaders in ‘historic’ first UK visit to press for justice',
    category: 'world',
    source: 'The Guardian',
  };

  try {
    // Step 1: Evaluate quality
    const quality = await ai.evaluateArticleQuality(article);
    console.log('Quality evaluation:', quality);

    // Step 2: Generate summary + image prompt
    if (ai.generateSummaryAndImagePrompt) {
      const { summary, imagePrompt } = await ai.generateSummaryAndImagePrompt(article);
      console.log('Summary:', summary);
      console.log('Image prompt:', imagePrompt);

      // Step 3: Generate daily impact
      const dailyImpact = await ai.generateDailyImpact(article, summary);
      console.log('Daily Impact:', dailyImpact);

      // Step 4: Validate summary and impact
      const validation = ai.validateSummaryAndImpact(article, summary, dailyImpact);
      console.log('Validation:', validation);
    }

    // Step 5: Process the full article
    const processed = await ai.processArticle(article);
    console.log('Processed article:', processed);

  } catch (error) {
    console.error('Error during testing:', error);
  }
}

test();
