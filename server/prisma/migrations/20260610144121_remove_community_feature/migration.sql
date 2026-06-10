-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_communityId_fkey";

-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_cityId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityMember" DROP CONSTRAINT "CommunityMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityMember" DROP CONSTRAINT "CommunityMember_communityId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_communityId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_postId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_userId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "communityId";

-- DropTable
DROP TABLE "Community";

-- DropTable
DROP TABLE "CommunityMember";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Reaction";

-- DropEnum
DROP TYPE "ReactionType";

