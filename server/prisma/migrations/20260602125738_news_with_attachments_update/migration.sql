-- DropIndex
DROP INDEX "Alert_cityId_deletedAt_createdAt_idx";

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "newsId" TEXT;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "GeneralNews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
