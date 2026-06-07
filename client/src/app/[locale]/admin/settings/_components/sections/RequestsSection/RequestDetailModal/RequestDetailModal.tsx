import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { AdminAttachment, AdminCityCreationRequest } from '@/types';
import { StatusBadge } from '../../../StatusBadge/StatusBadge';

export function RequestDetailModal({
  request,
  open,
  isPending,
  onOpenChange,
  onApprove,
  onReject,
}: {
  request: AdminCityCreationRequest | null;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: (rejectionReason: string) => void;
}) {
  const t = useTranslations();
  const [rejectionReason, setRejectionReason] = useState('');

  if (!request) return null;

  const canReview = request.status === 'PENDING';
  const primaryAttachment = request.attachments?.[0] ?? null;
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRejectionReason('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] max-w-4xl overflow-y-auto p-0"
      >
        <div className="space-y-4 p-4 md:p-5">
          <DialogHeader className="pr-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <DialogTitle>{request.name}</DialogTitle>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {request.region}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label={t('platformAdmin.city')} value={request.name} />
            <DetailItem
              label={t('platformAdmin.region')}
              value={request.region}
            />
            <DetailItem
              label={t('platformAdmin.domain')}
              value={request.domain}
            />
            <DetailItem
              label={t('platformAdmin.domainVerifiedAt')}
              value={formatDateTime(request.domainVerifiedAt)}
            />
            <DetailItem
              label={t('platformAdmin.coordinates')}
              value={formatCoordinates(request.centerLat, request.centerLng)}
            />
            <DetailItem
              label={t('platformAdmin.requester')}
              value={`${request.requester.name} <${request.requester.email}>`}
            />
            <DetailItem
              label={t('platformAdmin.createdAt')}
              value={formatDateTime(request.createdAt)}
            />
            <DetailItem
              label={t('platformAdmin.reviewedBy')}
              value={
                request.reviewedBy
                  ? `${request.reviewedBy.name} <${request.reviewedBy.email}>`
                  : null
              }
            />
            <DetailItem
              label={t('platformAdmin.reviewedAt')}
              value={formatDateTime(request.reviewedAt)}
            />
          </div>

          {request.rejectionReason ? (
            <div className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2">
              <p className="text-xs font-semibold uppercase text-[var(--danger-dark)]">
                {t('platformAdmin.rejectionReason')}
              </p>
              <p className="mt-1 text-sm text-[var(--primary)]">
                {request.rejectionReason}
              </p>
            </div>
          ) : null}

          <AttachmentPanel
            attachment={primaryAttachment}
            attachments={request.attachments ?? []}
          />

          {canReview ? (
            <div className="rounded-md border border-black/10 bg-[var(--surface-2)] p-3">
              <label className="text-xs font-semibold uppercase text-[var(--primary-light)]">
                {t('platformAdmin.rejectionReason')}
              </label>
              <Input
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder={t('platformAdmin.rejectionReason')}
                className="mt-2 h-10 bg-white"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-black/10 px-4 py-3 md:px-5">
          {canReview ? (
            <>
              <Button
                type="button"
                variant="danger"
                disabled={isPending || rejectionReason.trim().length < 3}
                onClick={() => onReject(rejectionReason)}
              >
                {t('platformAdmin.reject')}
              </Button>
              <Button type="button" disabled={isPending} onClick={onApprove}>
                {t('platformAdmin.approve')}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-md border border-black/10 px-3 py-2">
      <p className="text-xs font-semibold uppercase text-[var(--primary-light)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-[var(--primary)]">
        {value || '-'}
      </p>
    </div>
  );
}

function AttachmentPanel({
  attachment,
  attachments,
}: {
  attachment: AdminAttachment | null;
  attachments: AdminAttachment[];
}) {
  const t = useTranslations();

  if (!attachment) {
    return (
      <div className="rounded-md border border-black/10 px-3 py-4 text-sm text-[var(--muted-foreground)]">
        {t('platformAdmin.noDocument')}
      </div>
    );
  }

  const canPreview = isPreviewable(attachment);

  return (
    <section className="space-y-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--primary)]">
            {t('platformAdmin.attachment')}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {attachment.fileName}
          </p>
        </div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-[var(--secondary-dark)] underline-offset-2 hover:underline"
        >
          {t('platformAdmin.openDocument')}
        </a>
      </div>

      {canPreview ? (
        <div className="flex items-center justify-center rounded-md border border-black/10 bg-white p-4">
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="h-[10rem] w-[30rem] rounded-md border border-black/10 bg-white object-contain"
          />
        </div>
      ) : (
        <div className="rounded-md border border-black/10 px-3 py-4 text-sm text-[var(--muted-foreground)]">
          {t('platformAdmin.previewUnavailable')}
        </div>
      )}

      {attachments.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-black/10 px-2 py-1 text-xs font-medium text-[var(--primary)] hover:border-[var(--secondary)]"
            >
              {item.fileName}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function isPreviewable(attachment: AdminAttachment) {
  const mimeType = attachment.mimeType ?? '';
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

function formatCoordinates(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return '-';
  return `${lat}, ${lng}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
