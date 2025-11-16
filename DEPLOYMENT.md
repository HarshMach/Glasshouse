# The GlassHouse - Deployment Guide

## 🚀 Quick Start Deployment

### Step 1: Get API Keys

1. **Gemini API Key** (Required)
   - Visit: https://makersuite.google.com/app/apikey
   - Click "Get API Key"
   - Copy the key

2. **Unsplash API Key** (Optional)
   - Visit: https://unsplash.com/developers
   - Create an app
   - Copy the "Access Key"

3. **Pexels API Key** (Optional)
   - Visit: https://www.pexels.com/api/
   - Generate an API key

### Step 2: Setup Firebase

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not already)
# Select your existing Firebase project or create new one
firebase init

# When prompted, select:
# - Firestore
# - Functions
# - Use existing project
```

### Step 3: Configure Environment

**Option A: For Production (Recommended)**
```bash
# Set required API key
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Set optional keys
firebase functions:config:set unsplash.api_key="YOUR_UNSPLASH_KEY"
firebase functions:config:set pexels.api_key="YOUR_PEXELS_KEY"

# Set admin API key for protected endpoints
firebase functions:config:set api.key="YOUR_SECRET_KEY"
```

**Option B: For Local Development**
```bash
cd functions
cp .env.example .env

# Edit .env and add your keys
# GEMINI_API_KEY=your_key_here
# UNSPLASH_API_KEY=your_key_here
# etc.
```

### Step 4: Install Dependencies

```bash
cd functions
npm install
```

### Step 5: Deploy

```bash
# Deploy everything (Firestore + Functions)
firebase deploy

# Or deploy separately
firebase deploy --only firestore  # Deploy rules and indexes
firebase deploy --only functions   # Deploy cloud functions
```

### Step 6: Test

```bash
# Get your project URL from the deployment output
# It will look like: https://us-central1-YOUR_PROJECT.cloudfunctions.net

# Test health endpoint
curl https://us-central1-YOUR_PROJECT.cloudfunctions.net/health

# Manually trigger news fetch (requires API key)
curl -X POST https://us-central1-YOUR_PROJECT.cloudfunctions.net/fetchNews \
  -H "x-api-key: YOUR_API_KEY"

# Manually trigger AI processing (requires API key)
curl -X POST https://us-central1-YOUR_PROJECT.cloudfunctions.net/processArticles \
  -H "x-api-key: YOUR_API_KEY"
```

## 📅 Scheduled Functions

Once deployed, these functions will run automatically:

- **scheduledFetchNews**: Every 2 hours
- **scheduledProcessArticles**: Every 30 minutes
- **scheduledCleanupOldArticles**: Monthly (1st of each month at 4 AM)

You can view scheduled runs in Firebase Console → Functions

## 🔧 Post-Deployment Configuration

### 1. Verify Firestore Indexes

The indexes should be created automatically, but verify in Firebase Console:

Firebase Console → Firestore → Indexes

You should see indexes for:
- `articles` (processed, qualityScore, pubDate)
- `articles` (processed, category, qualityScore, pubDate)
- `comments` (articleId, reported, createdAt)

### 2. Check Firestore Rules

Firebase Console → Firestore → Rules

Make sure the rules are deployed and active.

### 3. Monitor Initial Runs

```bash
# Watch logs in real-time
firebase functions:log --only fetchNews
firebase functions:log --only processArticles
```

### 4. Set Up Billing Alerts (Important!)

1. Go to Google Cloud Console
2. Navigate to Billing → Budget & Alerts
3. Set budget alerts for your expected usage
4. Gemini free tier: 1,500 requests/day

## 🌐 Frontend Integration

Your frontend can now call these public endpoints:

```javascript
const API_URL = 'https://us-central1-YOUR_PROJECT.cloudfunctions.net';

// Get articles
const response = await fetch(`${API_URL}/getArticles?category=tech&limit=50`);
const data = await response.json();

// Search
const searchResponse = await fetch(`${API_URL}/searchArticles?q=climate`);

// Track view
await fetch(`${API_URL}/trackView`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ articleId: 'article_id' })
});

// Toggle like (userId should be from your frontend user management)
await fetch(`${API_URL}/toggleLike`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    articleId: 'article_id',
    userId: 'unique_user_id' // Generate in frontend or use localStorage
  })
});

// Add comment
await fetch(`${API_URL}/addComment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    articleId: 'article_id',
    userId: 'unique_user_id',
    username: 'User Name',
    text: 'Great article!'
  })
});

// Get comments
const comments = await fetch(`${API_URL}/getComments?articleId=article_id`);
```

## 🔄 Updating After Changes

```bash
# After making code changes
cd functions
npm run lint  # Check for errors

# Deploy only functions (faster)
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:getArticles
```

## 📊 Monitoring

### View Usage
- Firebase Console → Functions → Usage
- Monitor invocations, execution time, memory

### Check Costs
- Google Cloud Console → Billing → Reports
- Monitor Cloud Functions, Firestore, and API usage

### Set Up Alerts
- Firebase Console → Functions → Metrics
- Set up performance and error alerts

## 🐛 Common Issues

### "Permission denied" errors
**Solution**: Make sure Firestore rules are deployed
```bash
firebase deploy --only firestore:rules
```

### "Index required" errors
**Solution**: Deploy indexes
```bash
firebase deploy --only firestore:indexes
```

### Scheduled functions not running
**Solution**: Upgrade to Firebase Blaze (pay-as-you-go) plan
- Scheduled functions require Blaze plan
- Still very cheap for small-medium usage

### Out of quota errors
**Solution**: 
- Check your Gemini API usage at https://makersuite.google.com
- Adjust `AI_MAX_ARTICLES_PER_RUN` in `src/config/constants.js`
- Reduce scheduled function frequency

## 🎉 Success Checklist

- [ ] All API keys configured
- [ ] Functions deployed successfully
- [ ] Firestore rules and indexes active
- [ ] Health endpoint returns 200 OK
- [ ] Manual news fetch works
- [ ] Articles appear in Firestore
- [ ] AI processing completes successfully
- [ ] Frontend can fetch articles
- [ ] Engagement features work (likes, comments)
- [ ] Scheduled functions appear in Firebase Console
- [ ] Billing alerts configured

## 📞 Need Help?

Check the main README.md for:
- Full API documentation
- Troubleshooting guide
- Configuration options
- Architecture details
