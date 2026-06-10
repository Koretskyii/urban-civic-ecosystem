-- C: drop redundant `timestamp` columns (createdAt is the single source of truth).
ALTER TABLE "Alert" DROP COLUMN "timestamp";
ALTER TABLE "GeneralNews" DROP COLUMN "timestamp";

-- D: normalize Chat after Community removal.
-- Remove leftover community chats (no linked city request) so cityRequestId can be required.
-- Their messages are removed via ON DELETE CASCADE.
DELETE FROM "Chat" WHERE "cityRequestId" IS NULL;

ALTER TABLE "Chat" DROP CONSTRAINT "Chat_cityId_fkey";
ALTER TABLE "Chat" DROP COLUMN "cityId";
ALTER TABLE "Chat" DROP COLUMN "contextType";
ALTER TABLE "Chat" ALTER COLUMN "cityRequestId" SET NOT NULL;
