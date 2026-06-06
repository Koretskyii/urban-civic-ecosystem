import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminCityCreationRequests,
  useApproveCityCreationRequest,
  useRejectCityCreationRequest,
} from '@/hooks';
import type {
  AdminCityCreationRequest,
  CityCreationRequestStatus,
} from '@/types';
import { AdminCell, AdminTable } from '../../AdminTable/AdminTable';
import { AdminToolbar } from '../../AdminToolbar/AdminToolbar';
import { PaginationControls } from '../../PaginationControls/PaginationControls';
import { StatusBadge } from '../../StatusBadge/StatusBadge';
import { TableState } from '../../TableState/TableState';
import { RequestDetailModal } from './RequestDetailModal/RequestDetailModal';

const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const ADMIN_PAGE_SIZE = 25;
const REQUEST_COLUMNS = 'grid-cols-[18%_16%_22%_12%_12%_20%]';

export function RequestsSection() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CityCreationRequestStatus | 'ALL'>(
    'PENDING',
  );
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] =
    useState<AdminCityCreationRequest | null>(null);
  const query = useAdminCityCreationRequests({
    search,
    status: status === 'ALL' ? undefined : status,
    page,
    limit: ADMIN_PAGE_SIZE,
  });
  const approve = useApproveCityCreationRequest();
  const reject = useRejectCityCreationRequest();
  const pendingId = String(approve.variables ?? reject.variables?.id ?? '');

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <section className="space-y-3">
      <AdminToolbar title={t('platformAdmin.requests.title')} total={total}>
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder={t('platformAdmin.search')}
          className="h-10 md:w-64"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as CityCreationRequestStatus | 'ALL');
            setPage(1);
          }}
          className="h-10 rounded-md border border-black/10 px-3 text-sm outline-none"
        >
          <option value="ALL">{t('platformAdmin.allStatuses')}</option>
          {REQUEST_STATUSES.map((item) => (
            <option key={item} value={item}>
              {t(`platformAdmin.requestStatuses.${item}`)}
            </option>
          ))}
        </select>
      </AdminToolbar>

      <TableState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={items.length === 0}
      />

      {items.length > 0 ? (
        <>
          <AdminTable
            minWidth="1040px"
            columns={REQUEST_COLUMNS}
            headers={[
              t('platformAdmin.city'),
              t('platformAdmin.region'),
              t('platformAdmin.requester'),
              t('platformAdmin.status'),
              t('platformAdmin.createdAt'),
              t('platformAdmin.actions'),
            ]}
          >
            {items.map((item) => (
              <RequestRow
                key={item.id}
                item={item}
                isPending={pendingId === item.id}
                onOpenDetails={() => setSelectedRequest(item)}
              />
            ))}
          </AdminTable>
          <PaginationControls
            page={page}
            limit={ADMIN_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <RequestDetailModal
        request={selectedRequest}
        open={Boolean(selectedRequest)}
        isPending={pendingId === selectedRequest?.id}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
          }
        }}
        onApprove={() => {
          if (!selectedRequest) return;
          approve.mutate(selectedRequest.id, {
            onSuccess: () => setSelectedRequest(null),
          });
        }}
        onReject={(rejectionReason) => {
          if (!selectedRequest) return;
          reject.mutate(
            { id: selectedRequest.id, rejectionReason },
            { onSuccess: () => setSelectedRequest(null) },
          );
        }}
      />
    </section>
  );
}

function RequestRow({
  item,
  isPending,
  onOpenDetails,
}: {
  item: AdminCityCreationRequest;
  isPending: boolean;
  onOpenDetails: () => void;
}) {
  const t = useTranslations();
  const hasAttachment = Boolean(item.attachments?.[0]?.url);

  return (
    <div
      className={`grid ${REQUEST_COLUMNS} min-h-[74px] border-b border-black/10 bg-white text-sm`}
    >
      <AdminCell className="font-medium text-[var(--primary)]">
        {item.name}
      </AdminCell>
      <AdminCell>{item.region}</AdminCell>
      <AdminCell>
        {item.requester.name}
        <span className="block text-xs text-[var(--muted-foreground)]">
          {item.requester.email}
        </span>
      </AdminCell>
      <AdminCell>
        <StatusBadge status={item.status} />
      </AdminCell>
      <AdminCell>{formatDate(item.createdAt)}</AdminCell>
      <AdminCell>
        <div className="flex flex-wrap items-center gap-2">
          {hasAttachment ? (
            <span className="text-xs font-medium text-[var(--secondary-dark)]">
              {t('platformAdmin.document')}
            </span>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={onOpenDetails}
          >
            {t('platformAdmin.details')}
          </Button>
        </div>
      </AdminCell>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
