const functions = require('firebase-functions');
const fetch = require('node-fetch'); // make sure you have v2 installed

async function webSearch(query) {
  const API_KEY = functions.config().brave?.key;

  if (!API_KEY) {
    console.log("⚠️ Brave API key not found, returning empty results");
    return [];
  }

  console.log("🌐 Brave search query:", query);

  try {
    const res = await fetch(
      `https://api.search.brave.com/v1/web/search?q=${encodeURIComponent(query)}`,
      {
        headers: { "X-Subscription-Token": API_KEY }
      }
    );

    if (!res.ok) {
      console.warn(`⚠️ Brave API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const text = await res.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn(`⚠️ Brave API invalid JSON response: ${text.substring(0, 200)}...`);
      return [];
    }

    const results =
      data.web && data.web.results
        ? data.web.results.slice(0, 5).map(r => ({
            title: r.title,
            snippet: r.description,
          }))
        : [];

    console.log("🌐 Brave results:", results);
    return results;
  } catch (error) {
    console.error('🌐 Brave search error:', error);
    return [];
  }
}

module.exports = { webSearch };
