CREATE TYPE "SystemRole" AS ENUM ('USER', 'ADMIN');

CREATE TYPE "CityCreationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "User"
  ADD COLUMN "systemRole" "SystemRole" NOT NULL DEFAULT 'USER';

ALTER TABLE "City"
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "CityCreationRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "reviewedById" TEXT,
  "name" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "centerLat" DOUBLE PRECISION,
  "centerLng" DOUBLE PRECISION,
  "domain" TEXT,
  "status" "CityCreationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "rejectionReason" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CityCreationRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Attachment"
  ADD COLUMN "cityCreationRequestId" TEXT;

CREATE INDEX "City_deletedAt_name_idx" ON "City"("deletedAt", "name");
CREATE INDEX "CityCreationRequest_status_createdAt_idx" ON "CityCreationRequest"("status", "createdAt");
CREATE INDEX "CityCreationRequest_requesterId_status_idx" ON "CityCreationRequest"("requesterId", "status");
CREATE INDEX "CityCreationRequest_name_region_idx" ON "CityCreationRequest"("name", "region");

ALTER TABLE "CityCreationRequest"
  ADD CONSTRAINT "CityCreationRequest_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CityCreationRequest"
  ADD CONSTRAINT "CityCreationRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_cityCreationRequestId_fkey"
  FOREIGN KEY ("cityCreationRequestId") REFERENCES "CityCreationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
