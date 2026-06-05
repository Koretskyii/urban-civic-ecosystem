ALTER TABLE "Department" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Department" SET "isDefault" = true WHERE "type" <> 'CUSTOM';
