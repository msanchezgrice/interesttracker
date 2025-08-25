-- Update UserPreferences to use weeklyThemes and generalInterests
DO $$ 
BEGIN
    -- Add weeklyThemes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'UserPreferences' AND column_name = 'weeklyThemes') THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "weeklyThemes" TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add generalInterests if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'UserPreferences' AND column_name = 'generalInterests') THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "generalInterests" TEXT[] DEFAULT '{}';
    END IF;
    
    -- Copy existing focusThemes to weeklyThemes if focusThemes exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'UserPreferences' AND column_name = 'focusThemes') THEN
        UPDATE "UserPreferences" 
        SET "weeklyThemes" = "focusThemes"
        WHERE "focusThemes" IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE "UserPreferences" DROP COLUMN "focusThemes";
    END IF;
END $$;
