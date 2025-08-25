-- Add LinkedIn URL and expertise fields to UserPreferences
ALTER TABLE "UserPreferences" 
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "extractedExpertise" TEXT[] DEFAULT '{}',
ADD COLUMN "lastExpertiseSync" TIMESTAMP;
