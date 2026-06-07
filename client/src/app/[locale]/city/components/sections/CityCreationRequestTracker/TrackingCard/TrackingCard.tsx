import { Link } from "@/i18n/navigation";
import { CityCreationRequestTracking } from "@/types";
import { useTranslations } from "next-intl";
import { formatCoordinates, formatDateTime } from "../helpers";
import { DetailItem } from "../DetailItem/DetailItem";
import { StatusBadge } from "../StatusBadge/StatusBadge";

export function TrackingCard({ request }: { request: CityCreationRequestTracking }) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[var(--primary)]">
            {request.name}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {request.region}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <dl className="grid gap-2 text-sm">
        <DetailItem
          label={t('cityInit.trackingDomain')}
          value={request.domain}
        />
        <DetailItem
          label={t('cityInit.trackingCoordinates')}
          value={formatCoordinates(request.centerLat, request.centerLng)}
        />
        <DetailItem
          label={t('cityInit.trackingSubmittedAt')}
          value={formatDateTime(request.createdAt)}
        />
        <DetailItem
          label={t('cityInit.trackingReviewedAt')}
          value={formatDateTime(request.reviewedAt)}
        />
      </dl>

      {request.status === 'REJECTED' && request.rejectionReason ? (
        <div className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2">
          <p className="text-xs font-semibold uppercase text-[var(--danger-dark)]">
            {t('cityInit.trackingRejectionReason')}
          </p>
          <p className="mt-1 text-sm text-[var(--primary)]">
            {request.rejectionReason}
          </p>
        </div>
      ) : null}

      {request.status === 'APPROVED' && request.city ? (
        <Link
          href={`/city/${request.city.id}`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--secondary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--secondary-dark)]"
        >
          {t('cityInit.trackingOpenCity')}
        </Link>
      ) : null}
    </div>
  );
}