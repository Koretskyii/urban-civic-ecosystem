/*
  Warnings:

  - Made the column `region` on table `City` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "City" ALTER COLUMN "region" SET NOT NULL;

-- CreateTable
CREATE TABLE "CityDomain" (
    "id" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "CityDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityDomain_domainName_key" ON "CityDomain"("domainName");

-- CreateIndex
CREATE UNIQUE INDEX "CityDomain_token_key" ON "CityDomain"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CityDomain_cityId_key" ON "CityDomain"("cityId");

-- AddForeignKey
ALTER TABLE "CityDomain" ADD CONSTRAINT "CityDomain_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
