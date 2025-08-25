-- Update UserPreferences to use weeklyThemes and generalInterests
ALTER TABLE "UserPreferences" 
ADD COLUMN "weeklyThemes" TEXT[] DEFAULT '{}',
ADD COLUMN "generalInterests" TEXT[] DEFAULT '{}';

-- Copy existing focusThemes to weeklyThemes if any exist
UPDATE "UserPreferences" 
SET "weeklyThemes" = "focusThemes"
WHERE "focusThemes" IS NOT NULL;

-- Drop the old column
ALTER TABLE "UserPreferences" 
DROP COLUMN "focusThemes";
