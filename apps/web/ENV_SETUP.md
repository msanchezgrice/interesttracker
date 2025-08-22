# Environment Variables Setup

## Required Variables

### Database (Supabase)
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

### LLM Provider (Choose One)

#### Option 1: OpenAI
```
OPENAI_API_KEY="sk-..."
```
Get your API key from: https://platform.openai.com/api-keys

#### Option 2: Anthropic (Coming Soon)
```
ANTHROPIC_API_KEY="sk-ant-..."
```

### Optional: Authentication (Clerk)
```
CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
```

### Deployment
```
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
```

## Setting up in Vercel

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable above
4. Redeploy for changes to take effect

## Local Development

Create a `.env.local` file in `apps/web/` with the variables above.
