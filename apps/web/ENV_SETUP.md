# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `apps/web` directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# API Keys
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AIza..."

# App URL (for production)
NEXT_PUBLIC_APP_URL="https://interesttracker.vercel.app"
```

## Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` and Vercel environment variables

### OpenAI API Key (Optional - for fallback)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local` and Vercel environment variables

## Vercel Environment Variables

In your Vercel project settings, add the same environment variables:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development environments

## URL Context API Limits

The Google URL Context API has the following limits during experimental phase:
- 1500 queries per day per project
- 100 queries per day per user in Google AI Studio
- Up to 20 URLs per request
- Free during experimental phase