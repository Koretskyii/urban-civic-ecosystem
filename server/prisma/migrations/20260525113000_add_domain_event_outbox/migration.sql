DO $$ BEGIN
  CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "DomainEventOutbox" (
  "id" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DomainEventOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DomainEventOutbox_status_availableAt_createdAt_idx"
ON "DomainEventOutbox" ("status", "availableAt", "createdAt");

CREATE INDEX IF NOT EXISTS "DomainEventOutbox_aggregateType_aggregateId_idx"
ON "DomainEventOutbox" ("aggregateType", "aggregateId");
