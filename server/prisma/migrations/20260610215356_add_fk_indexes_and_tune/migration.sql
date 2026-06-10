-- DB optimization: index FK columns (Postgres does not auto-index them),
-- cover the hot city-requests list query, and drop a redundant index.

-- 1. Attachment FKs (fetched via `include: { attachments }`, cascade deletes)
CREATE INDEX "Attachment_cityRequestId_idx" ON "Attachment"("cityRequestId");
CREATE INDEX "Attachment_reportId_idx" ON "Attachment"("reportId");
CREATE INDEX "Attachment_cityCreationRequestId_idx" ON "Attachment"("cityCreationRequestId");
CREATE INDEX "Attachment_newsId_idx" ON "Attachment"("newsId");
CREATE INDEX "Attachment_cityId_idx" ON "Attachment"("cityId");

-- 2. Message: chat history (where chatId order by timestamp) + cascade by author
CREATE INDEX "Message_chatId_timestamp_idx" ON "Message"("chatId", "timestamp");
CREATE INDEX "Message_authorId_idx" ON "Message"("authorId");

-- 3. Report: fetched per request (include) + cascade by author
CREATE INDEX "Report_cityRequestId_idx" ON "Report"("cityRequestId");
CREATE INDEX "Report_authorId_idx" ON "Report"("authorId");

-- 4. UserRole: RBAC lookups + cascade on role delete
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- 5. Cascade-on-user-delete for growing tables
CREATE INDEX "Alert_publisherId_idx" ON "Alert"("publisherId");
CREATE INDEX "GeneralNews_publisherId_idx" ON "GeneralNews"("publisherId");
CREATE INDEX "CityCreationRequest_reviewedById_idx" ON "CityCreationRequest"("reviewedById");

-- 6. Cover the hot city-requests list query: filter cityId[/status] + sort createdAt desc
DROP INDEX "CityRequest_cityId_status_idx";
CREATE INDEX "CityRequest_cityId_status_createdAt_idx" ON "CityRequest"("cityId", "status", "createdAt" DESC);

-- 7. Drop index redundant with the @unique constraint (CityCreationRequest.domainVerificationId)
DROP INDEX "CityCreationRequest_domainVerificationId_idx";
