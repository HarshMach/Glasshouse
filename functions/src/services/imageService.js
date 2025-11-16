/**
 * Image Service
 * Fetches stock images from Unsplash or Pexels based on article keywords
 */

const { IMAGE_CONFIG } = require('../config/constants');

class ImageService {
  constructor(unsplashKey = null, pexelsKey = null) {
    this.unsplashKey = unsplashKey;
    this.pexelsKey = pexelsKey;
  }

  /**
   * Fetch image from Unsplash
   */
  async fetchFromUnsplash(query) {
    if (!this.unsplashKey) {
      return null;
    }

    try {
      const url = `${IMAGE_CONFIG.UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.unsplashKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        return {
          url: photo.urls.regular,
          thumbnail: photo.urls.small,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
          source: 'unsplash',
          downloadLocation: photo.links.download_location,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching from Unsplash:', error);
      return null;
    }
  }

  /**
   * Fetch image from Pexels
   */
  async fetchFromPexels(query) {
    if (!this.pexelsKey) {
      return null;
    }

    try {
      const url = `${IMAGE_CONFIG.PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.pexelsKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        return {
          url: photo.src.large,
          thumbnail: photo.src.medium,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          source: 'pexels',
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching from Pexels:', error);
      return null;
    }
  }

  /**
   * Get image for article based on keywords
   * Tries Unsplash first, then Pexels, then fallback
   */
  async getImageForArticle(keywords, category) {
    // Try with specific keywords first
    let image = await this.fetchFromUnsplash(keywords);
    if (image) return image;

    image = await this.fetchFromPexels(keywords);
    if (image) return image;

    // Try with just category
    if (category && category !== 'general') {
      image = await this.fetchFromUnsplash(category);
      if (image) return image;

      image = await this.fetchFromPexels(category);
      if (image) return image;
    }

    // Try with fallback query
    image = await this.fetchFromUnsplash(IMAGE_CONFIG.FALLBACK_QUERY);
    if (image) return image;

    image = await this.fetchFromPexels(IMAGE_CONFIG.FALLBACK_QUERY);
    if (image) return image;

    return null;
  }

  /**
   * Trigger download tracking for Unsplash (required by API guidelines)
   */
  async trackUnsplashDownload(downloadLocation) {
    if (!this.unsplashKey || !downloadLocation) return;

    try {
      await fetch(downloadLocation, {
        headers: {
          'Authorization': `Client-ID ${this.unsplashKey}`,
        },
      });
    } catch (error) {
      console.error('Error tracking Unsplash download:', error);
    }
  }
}

module.exports = ImageService;
