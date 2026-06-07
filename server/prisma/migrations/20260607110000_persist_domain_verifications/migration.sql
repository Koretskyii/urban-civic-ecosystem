ALTER TABLE "CityCreationRequest"
  ADD COLUMN "domainVerificationId" TEXT,
  ADD COLUMN "domainVerifiedAt" TIMESTAMP(3);

CREATE TABLE "DomainVerification" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DomainVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainVerification_token_key" ON "DomainVerification"("token");
CREATE UNIQUE INDEX "CityCreationRequest_domainVerificationId_key" ON "CityCreationRequest"("domainVerificationId");
CREATE INDEX "CityCreationRequest_domainVerificationId_idx" ON "CityCreationRequest"("domainVerificationId");
CREATE INDEX "DomainVerification_requesterId_domain_verifiedAt_idx" ON "DomainVerification"("requesterId", "domain", "verifiedAt");
CREATE INDEX "DomainVerification_domain_verifiedAt_idx" ON "DomainVerification"("domain", "verifiedAt");

ALTER TABLE "DomainVerification"
  ADD CONSTRAINT "DomainVerification_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CityCreationRequest"
  ADD CONSTRAINT "CityCreationRequest_domainVerificationId_fkey"
  FOREIGN KEY ("domainVerificationId") REFERENCES "DomainVerification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
