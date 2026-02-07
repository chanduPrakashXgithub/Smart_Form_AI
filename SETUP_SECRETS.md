# Setup Secrets Guide

## Important: Do NOT commit actual secrets to Git!

This project requires several API keys and credentials. Follow these steps to set them up:

## Backend Environment Variables

1. **Copy the example file:**

   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Fill in your actual values in `.env`:**

### MongoDB Connection

- **MONGODB_URI**: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/vision-form-mern`
  - Cloud: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### JWT Secret

- **JWT_SECRET**: Generate a strong random string
  - Use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Google Gemini API Key

- **GEMINI_API_KEY**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
  1. Go to Google AI Studio
  2. Click "Get API Key"
  3. Create or select a project
  4. Copy the generated key

### Google Vision API

- **GOOGLE_VISION_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com)
  1. Create or select a project
  2. Enable Vision API
  3. Create credentials (API Key)
- **GOOGLE_VISION_KEY_FILE**: Path to service account JSON file
  1. Go to Google Cloud Console → IAM & Admin → Service Accounts
  2. Create Service Account
  3. Grant Vision API permissions
  4. Create JSON key
  5. Save as `backend/credentials.json`

## Google Service Account Credentials

1. **Copy the example file:**

   ```bash
   cd backend
   cp credentials.json.example credentials.json
   ```

2. **Replace with your actual service account JSON** from Google Cloud Console

## Verification

Run this to verify your API key is loaded:

```bash
cd backend
node test-api-key.js
```

## Security Checklist

- ✅ `.env` is in .gitignore
- ✅ `credentials.json` is in .gitignore
- ✅ Never commit actual API keys
- ✅ Rotate keys if accidentally exposed
- ✅ Use different keys for production

## .gitignore Protection

The following files are automatically excluded from Git:

- `backend/.env`
- `backend/credentials.json`
- `backend/uploads/`
- `node_modules/`

## If You Accidentally Commit Secrets

1. **Immediately rotate/delete the exposed keys**
2. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env backend/credentials.json" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push (⚠️ dangerous, coordinate with team):**
   ```bash
   git push origin --force --all
   ```

## Environment Variables Reference

| Variable               | Required | Description                          |
| ---------------------- | -------- | ------------------------------------ |
| MONGODB_URI            | ✅       | MongoDB connection string            |
| JWT_SECRET             | ✅       | Secret for JWT token signing         |
| GEMINI_API_KEY         | ✅       | Google Gemini AI API key             |
| GOOGLE_VISION_API_KEY  | ⚠️       | Google Vision API key (alternative)  |
| GOOGLE_VISION_KEY_FILE | ⚠️       | Path to service account JSON         |
| PORT                   | ❌       | Server port (default: 5000)          |
| NODE_ENV               | ❌       | Environment (development/production) |
| FRONTEND_URL           | ❌       | Frontend URL for CORS                |

**Note**: Either use GOOGLE_VISION_API_KEY or GOOGLE_VISION_KEY_FILE (credentials.json)

---

**Need Help?**

- Check [Google Cloud Documentation](https://cloud.google.com/docs)
- See project README.md for more setup instructions
