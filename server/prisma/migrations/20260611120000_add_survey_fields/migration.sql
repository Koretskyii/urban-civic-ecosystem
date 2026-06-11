-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResultsVisibility" AS ENUM ('LIVE', 'AFTER_VOTE', 'AFTER_CLOSE');

-- AlterEnum
ALTER TYPE "InAppNotificationType" ADD VALUE 'SURVEY_CREATED';
ALTER TYPE "InAppNotificationType" ADD VALUE 'SURVEY_CLOSED';

-- AlterTable Survey
ALTER TABLE "Survey"
  ADD COLUMN "publisherId"       TEXT,
  ADD COLUMN "status"            "SurveyStatus"      NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "resultsVisibility" "ResultsVisibility" NOT NULL DEFAULT 'AFTER_VOTE',
  ADD COLUMN "allowVoteChange"   BOOLEAN             NOT NULL DEFAULT true,
  ADD COLUMN "closesAt"          TIMESTAMP(3),
  ADD COLUMN "closedAt"          TIMESTAMP(3),
  ADD COLUMN "updatedAt"         TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "deletedAt"         TIMESTAMP(3);

-- AlterTable SurveyOption
ALTER TABLE "SurveyOption"
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Vote
ALTER TABLE "Vote"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_publisherId_fkey"
  FOREIGN KEY ("publisherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Survey_cityId_status_deletedAt_createdAt_idx"
  ON "Survey"("cityId", "status", "deletedAt", "createdAt" DESC);

CREATE INDEX "Survey_status_closesAt_idx" ON "Survey"("status", "closesAt");
CREATE INDEX "Survey_publisherId_idx"      ON "Survey"("publisherId");

CREATE INDEX "SurveyOption_surveyId_position_idx" ON "SurveyOption"("surveyId", "position");

CREATE INDEX "Vote_surveyOptionId_idx" ON "Vote"("surveyOptionId");
