

const crypto = require('crypto');
const { URL } = require('url');

function isValidRSSUrl(url) {
  try {
    if (!url || typeof url !== 'string') return false;
    const parsedUrl = new URL(url);

    const rssIndicators = ['rss', 'feed', 'xml', 'atom'];
    const hasRssIndicator = rssIndicators.some(
      (indicator) =>
        parsedUrl.pathname.toLowerCase().includes(indicator) ||
        parsedUrl.hostname.toLowerCase().includes(indicator)
    );

    const rssExtensions = ['.rss', '.xml', '.atom'];
    const hasRssExtension = rssExtensions.some((ext) =>
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );

    const rssPaths = ['/rss/', '/feed/', '/feeds/', '/news/', '/blog/'];
    const hasRssPath = rssPaths.some((path) =>
      parsedUrl.pathname.toLowerCase().includes(path)
    );

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    return hasRssIndicator || hasRssExtension || hasRssPath;
  } catch (error) {
    console.error('URL validation error:', error);
    return false;
  }
}


function isValidUrl(url) {
  try {
    if (!url || typeof url !== 'string') return false;
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}


function sanitizeRSSItem(item) {
  if (!item || typeof item !== 'object') {
    return {};
  }

  try {
    const sanitized = {};
    const stringFields = [
      'title',
      'link',
      'description',
      'content',
      'contentSnippet',
    ];

    stringFields.forEach((field) => {
      if (item[field] && typeof item[field] === 'string') {
        sanitized[field] = item[field]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/data:\s*text\/html/gi, '')
          .trim();
      } else {
        sanitized[field] = item[field] || '';
      }
    });

    if (item.pubDate) {
      try {
        sanitized.pubDate = new Date(item.pubDate).toISOString();
      } catch (dateError) {
        sanitized.pubDate = new Date().toISOString();
      }
    }

    if (item.enclosure && typeof item.enclosure === 'object') {
      sanitized.enclosure = {
        url: item.enclosure.url
          ? item.enclosure.url.replace(/javascript:/gi, '')
          : '',
        type: item.enclosure.type || '',
        length: item.enclosure.length || 0,
      };
    }

    return sanitized;
  } catch (error) {
    console.error('RSS item sanitization error:', error);
    return item;
  }
}


function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


function extractImageUrl(item) {
  if (!item) return null;
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
  const imgMatch = (item.content || item.description || '').match(
    /<img[^>]+src="([^">]+)"/
  );
  return imgMatch ? imgMatch[1] : null;
}


function generateHash(str) {
  try {
    if (!str || typeof str !== 'string') {
      throw new Error('Invalid input for hash generation');
    }
    return crypto
      .createHash('sha256')
      .update(str)
      .digest('hex')
      .substring(0, 32);
  } catch (error) {
    console.error('Hash generation error:', error);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36) + '_' + Date.now();
  }
}


function extractKeywords(text, limit = 5) {
  if (!text || typeof text !== 'string') return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'about', 'after',
    'says', 'new', 'just', 'said', 'also', 'more', 'than', 'other',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  
  const wordCount = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

 
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((entry) => entry[0]);
}


function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function verifyApiKey(req, validApiKey) {
  if (!validApiKey) {
    console.warn('API_KEY not configured - authentication disabled');
    return true;
  }
  const apiKey = req.headers['x-api-key'];
  return apiKey === validApiKey;
}


function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
}



function cleanHtml(html) {
  if (!html || typeof html !== 'string') return '';

  return html

  
    .replace(/<[^>]+>/g, ' ')

    .replace(/https?:\/\/\S+/gi, '')
    .replace(/continue reading.*/gi, '')
    .replace(/read more.*/gi, '')
    .replace(/click here.*/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}


module.exports = {
  isValidRSSUrl,
  isValidUrl,
  sanitizeRSSItem,
  cleanText,
  extractImageUrl,
  generateHash,
  extractKeywords,
  delay,
  verifyApiKey,
  getClientIp,
  fuzzyMatch,
  cleanHtml,
};
