import { Badge } from "@/components/ui/badge";
import { CityCreationRequestTracking } from "@/types";
import { useTranslations } from "next-intl";

export function StatusBadge({
  status,
}: {
  status: CityCreationRequestTracking['status'];
}) {
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