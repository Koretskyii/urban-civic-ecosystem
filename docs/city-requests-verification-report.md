# City Requests Verification Report

Date: 2026-05-21
Branch: `feature/city-requests-flow`

## Automated Verification

### Server
1. Unit tests:
- `city-requests.service.spec.ts` - PASS
- `city-requests.gateway.spec.ts` - PASS
2. E2E lifecycle:
- `city-requests.e2e-spec.ts` - PASS
- Flow covered: `create -> assign -> report -> chat -> resolve`
3. Build:
- `npm run build` - PASS

### Client
1. Lint:
- `npm run lint` - PASS (no errors)
- Known warning: `client/src/app/[locale]/city/create/page.tsx` unused `t`
2. Build:
- `npm run build` - PASS

## Checklist Execution Status

Based on `docs/city-requests-manual-smoke-checklist.md`:

1. Flow A (Citizen Create + Track):
- API/data behavior covered by e2e: PASS
- UI-level manual check: PENDING

2. Flow B (Municipality Assign + Progress + Resolve):
- API/data behavior covered by e2e: PASS
- UI-level manual check (including attachment preview): PENDING

3. Flow C (Realtime Chat in 2 sessions):
- Backend event + client invalidation logic covered by unit/integration checks: PASS
- Two-browser live realtime validation: PENDING

4. Flow D (Permissions):
- Cross-user protection covered by service/controller tests: PASS
- Manual direct-link check: PENDING

## Remaining Manual Checks
1. Run full UI smoke in 2 browser sessions (citizen + municipality).
2. Verify live chat delivery both directions without manual reload.
3. Verify resolution attachment is visible to citizen in detail/timeline.
4. Verify unauthorized citizen cannot open foreign request detail URL.

## Notes
1. E2E teardown updated to close Prisma connection explicitly; no open-handle warning after fix.
2. Next.js warning about deprecated middleware file convention is non-blocking for this feature scope.
