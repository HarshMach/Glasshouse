require('dotenv').config();
const fetch = require('node-fetch'); // make sure you have v2 installed

async function webSearch(query) {
  const API_KEY = process.env.BRAVE_KEY;

  console.log("🌐 Brave search query:", query);

  const res = await fetch(
    `https://api.search.brave.com/v1/web/search?q=${encodeURIComponent(query)}`,
    {
      headers: { "X-Subscription-Token": API_KEY }
    }
  );

  const data = await res.json();

  const results =
    data.web && data.web.results
      ? data.web.results.slice(0, 5).map(r => ({
          title: r.title,
          snippet: r.description,
        }))
      : [];

  console.log("🌐 Brave results:", results);
  return results;
}

module.exports = { webSearch };
