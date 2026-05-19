-- Deduplicate existing alert types before adding the unique constraint.
WITH duplicate_alert_types AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (PARTITION BY name ORDER BY id) AS canonical_id,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS row_number
    FROM "AlertType"
)
UPDATE "Alert"
SET "typeId" = duplicate_alert_types.canonical_id
FROM duplicate_alert_types
WHERE "Alert"."typeId" = duplicate_alert_types.id
  AND duplicate_alert_types.row_number > 1;

WITH duplicate_alert_types AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (PARTITION BY name ORDER BY id) AS canonical_id,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS row_number
    FROM "AlertType"
),
duplicate_subscriptions AS (
    SELECT
        "AlertSubscription"."userId",
        "AlertSubscription"."cityId",
        duplicate_alert_types.canonical_id AS "alertTypeId"
    FROM "AlertSubscription"
    JOIN duplicate_alert_types ON duplicate_alert_types.id = "AlertSubscription"."alertTypeId"
    WHERE duplicate_alert_types.row_number > 1
)
INSERT INTO "AlertSubscription" ("userId", "cityId", "alertTypeId")
SELECT "userId", "cityId", "alertTypeId"
FROM duplicate_subscriptions
ON CONFLICT ("userId", "cityId", "alertTypeId") DO NOTHING;

WITH duplicate_alert_types AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS row_number
    FROM "AlertType"
)
DELETE FROM "AlertSubscription"
USING duplicate_alert_types
WHERE "AlertSubscription"."alertTypeId" = duplicate_alert_types.id
  AND duplicate_alert_types.row_number > 1;

WITH duplicate_alert_types AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS row_number
    FROM "AlertType"
)
DELETE FROM "AlertType"
USING duplicate_alert_types
WHERE "AlertType"."id" = duplicate_alert_types.id
  AND duplicate_alert_types.row_number > 1;

-- CreateIndex
CREATE UNIQUE INDEX "AlertType_name_key" ON "AlertType"("name");
