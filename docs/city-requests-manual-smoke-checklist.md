# City Requests Manual Smoke Checklist

## Scope
- Route: `/[locale]/city/[id]/problem`
- Roles: `citizen`, `municipality`
- Sessions: 2 parallel browser sessions (or 2 profiles)

## Preconditions
1. Backend is running with valid DB connection.
2. Frontend is running and reachable.
3. Two users exist and are city members:
- user A: citizen permissions
- user B: municipality permissions
4. At least one active department exists for the city.

## Flow A: Citizen Create + Track
1. Open problem page as citizen.
2. Fill create form with title and description.
3. Place map marker by clicking on map.
4. Verify lat/lng fields auto-populate.
5. Submit request.
6. Verify request appears in list and detail opens.
7. Verify map preview is visible in detail.
8. Verify initial status is visible.

Expected:
- Create succeeds.
- Coordinates are saved and rendered.
- Citizen sees own request in "mine" scope.

## Flow B: Municipality Assign + Progress + Resolve
1. Open same city problem page as municipality in second session.
2. Switch to municipality view.
3. Find created request in queue.
4. Assign department and confirm status progression.
5. Add `PROGRESS` report with text.
6. Add `RESOLUTION` report with status `RESOLVED`, text, and attachment (photo/file).

Expected:
- Assignment is persisted.
- Timeline contains progress and resolution entries.
- Final status is `RESOLVED`.
- Final report attachment is accessible.

## Flow C: Chat Realtime (2 Sessions)
1. Keep request detail open in both sessions.
2. Send message from citizen.
3. Verify municipality sees message without manual reload.
4. Send reply from municipality.
5. Verify citizen sees reply without manual reload.
6. Refresh one session and verify chat history loads via REST fallback.

Expected:
- Realtime delivery works both directions.
- Reconnect/refresh keeps message history consistent.

## Flow D: Permissions
1. Login as a different citizen (not request owner).
2. Try opening direct detail URL for request.

Expected:
- Access to foreign citizen request detail is denied.

## Final Verification Notes
Record:
1. City id and request id used for test.
2. Whether each flow passed/failed.
3. Any console/network errors.
4. Screenshot references (optional).
