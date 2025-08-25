-- Add LinkedIn URL and expertise fields to UserPreferences
ALTER TABLE "UserPreferences" 
ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT,
ADD COLUMN IF NOT EXISTS "extractedExpertise" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "lastExpertiseSync" TIMESTAMP;
