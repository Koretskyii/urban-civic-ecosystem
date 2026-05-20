/*
  Warnings:

  - Added the required column `authorId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PROGRESS', 'RESOLUTION', 'REJECTION');

-- AlterTable
ALTER TABLE "CityRequest" ADD COLUMN     "address" TEXT,
ADD COLUMN     "assignedDepartmentId" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "status" "RequestStatus",
ADD COLUMN     "type" "ReportType" NOT NULL;

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_cityId_isActive_idx" ON "Department"("cityId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Department_cityId_name_key" ON "Department"("cityId", "name");

-- CreateIndex
CREATE INDEX "CityRequest_cityId_status_idx" ON "CityRequest"("cityId", "status");

-- CreateIndex
CREATE INDEX "CityRequest_cityId_assignedDepartmentId_idx" ON "CityRequest"("cityId", "assignedDepartmentId");

-- AddForeignKey
ALTER TABLE "CityRequest" ADD CONSTRAINT "CityRequest_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
