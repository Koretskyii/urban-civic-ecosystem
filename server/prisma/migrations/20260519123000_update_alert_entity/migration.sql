-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_typeId_fkey";

-- AlterTable
ALTER TABLE "Alert" RENAME COLUMN "typeId" TO "alertTypeId";
ALTER TABLE "Alert" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Оголошення';
ALTER TABLE "Alert" ALTER COLUMN "title" DROP DEFAULT;
ALTER TABLE "Alert" DROP COLUMN "authorId";

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_alertTypeId_fkey" FOREIGN KEY ("alertTypeId") REFERENCES "AlertType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
