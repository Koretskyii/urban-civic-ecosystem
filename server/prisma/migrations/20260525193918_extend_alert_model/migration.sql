-- AlterTable
ALTER TABLE "Alert" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DomainEventOutbox" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GeneralNews" ALTER COLUMN "updatedAt" DROP DEFAULT;
