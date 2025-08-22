-- AlterTable
ALTER TABLE "Event" ADD COLUMN "metadataFetched" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Event" ADD COLUMN "themes" TEXT[];
ALTER TABLE "Event" ADD COLUMN "contentTags" TEXT[];
ALTER TABLE "Event" ADD COLUMN "interestScore" INTEGER;
ALTER TABLE "Event" ADD COLUMN "potentialIdeas" JSONB;

-- CreateIndex
CREATE INDEX "Event_interestScore_idx" ON "Event"("interestScore");
CREATE INDEX "Event_themes_idx" ON "Event"("themes");

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN "format" "Platform";
ALTER TABLE "Idea" ADD COLUMN "estimatedReach" JSONB;
ALTER TABLE "Idea" ADD COLUMN "tags" TEXT[];
ALTER TABLE "Idea" ADD COLUMN "proposedOutput" JSONB;
ALTER TABLE "Idea" ADD COLUMN "sourceEventIds" TEXT[];
