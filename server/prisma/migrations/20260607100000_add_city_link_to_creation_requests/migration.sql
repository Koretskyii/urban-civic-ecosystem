ALTER TABLE "CityCreationRequest"
  ADD COLUMN "cityId" TEXT;

CREATE INDEX "CityCreationRequest_cityId_idx" ON "CityCreationRequest"("cityId");

ALTER TABLE "CityCreationRequest"
  ADD CONSTRAINT "CityCreationRequest_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
