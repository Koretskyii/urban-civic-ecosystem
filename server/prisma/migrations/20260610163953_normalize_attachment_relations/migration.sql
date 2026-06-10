-- Normalize Attachment: replace polymorphic entityId/entityType with typed FKs.
-- Adds City FK (for verification documents) and backfills explicit FKs from the
-- legacy polymorphic columns before dropping them.

-- AddColumn
ALTER TABLE "Attachment" ADD COLUMN "cityId" TEXT;

-- Backfill explicit FKs from legacy polymorphic columns (only where still NULL)
UPDATE "Attachment" SET "cityRequestId"         = "entityId" WHERE "entityType" = 'CITY_REQUEST'          AND "cityRequestId" IS NULL;
UPDATE "Attachment" SET "reportId"              = "entityId" WHERE "entityType" = 'REPORT'                AND "reportId" IS NULL;
UPDATE "Attachment" SET "newsId"                = "entityId" WHERE "entityType" = 'NEWS'                  AND "newsId" IS NULL;
UPDATE "Attachment" SET "cityCreationRequestId" = "entityId" WHERE "entityType" = 'CITY_CREATION_REQUEST' AND "cityCreationRequestId" IS NULL;
UPDATE "Attachment" SET "cityId"                = "entityId" WHERE "entityType" = 'CITY_VERIFICATION';

-- DropColumn
ALTER TABLE "Attachment" DROP COLUMN "entityId";
ALTER TABLE "Attachment" DROP COLUMN "entityType";

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
