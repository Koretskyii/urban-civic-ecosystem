-- Single source of truth for domain verification (DomainVerification).
-- Drops denormalized snapshots: CityCreationRequest.domainVerifiedAt and
-- vestigial CityDomain.token / CityDomain.verifiedAt.
-- No backfill needed — token/verifiedAt remain available via DomainVerification
-- (reachable from City -> CityCreationRequest -> domainVerification).

-- DropIndex
DROP INDEX IF EXISTS "CityDomain_token_key";

-- AlterTable
ALTER TABLE "CityCreationRequest" DROP COLUMN "domainVerifiedAt";

-- AlterTable
ALTER TABLE "CityDomain" DROP COLUMN "token";
ALTER TABLE "CityDomain" DROP COLUMN "verifiedAt";
