/*
  Warnings:

  - You are about to drop the `CrowdfundingProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Donation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CrowdfundingProject" DROP CONSTRAINT "CrowdfundingProject_cityId_fkey";

-- DropForeignKey
ALTER TABLE "CrowdfundingProject" DROP CONSTRAINT "CrowdfundingProject_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_contributorId_fkey";

-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_projectId_fkey";

-- DropTable
DROP TABLE "CrowdfundingProject";

-- DropTable
DROP TABLE "Donation";
