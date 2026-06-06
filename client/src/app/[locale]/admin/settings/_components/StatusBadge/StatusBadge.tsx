import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { CityCreationRequestStatus } from '@/types';

export function StatusBadge({ status }: { status: CityCreationRequestStatus }) {
  const t = useTranslations();
  const variant =
    status === 'APPROVED'
      ? 'success'
      : status === 'REJECTED'
        ? 'danger'
        : 'warning';

  return (
    <Badge variant={variant}>
      {t(`platformAdmin.requestStatuses.${status}`)}
    </Badge>
  );
}
