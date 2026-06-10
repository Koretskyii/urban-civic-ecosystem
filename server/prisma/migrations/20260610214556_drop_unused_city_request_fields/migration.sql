-- Drop unused CityRequest fields:
--   location  — write-only, never read/displayed (superseded by locationLat/Lng + address)
--   category  — stored but no UI picker and never displayed
ALTER TABLE "CityRequest" DROP COLUMN "location";
ALTER TABLE "CityRequest" DROP COLUMN "category";
