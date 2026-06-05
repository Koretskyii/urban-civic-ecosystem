import { FilePreviewList } from '@/components/ui/file-preview-list';
import { useCityById } from '@/hooks';
import type { Attachment } from '@/types';
import { useTranslations } from 'next-intl';

export function CityProfileSettingsSection({ cityId }: { cityId: string }) {
  const t = useTranslations();
  const cityQuery = useCityById(cityId);
  const city = cityQuery.data;
  const domain = city?.domain ?? city?.cityDomain?.domainName ?? null;
  const verificationDocuments = city?.verificationDocument
    ? ([city.verificationDocument] as Attachment[])
    : [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--primary)]">
          {t('adminSettings.sections.city-profile')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t('adminSettings.cityProfile.subtitle')}
        </p>
      </div>

      {cityQuery.isLoading ? (
        <div className="text-sm text-[var(--muted-foreground)]">Loading...</div>
      ) : null}

      {cityQuery.isError ? (
        <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
          {t('adminSettings.cityProfile.loadError')}
        </p>
      ) : null}

      {city ? (
        <>
          <div className="overflow-x-auto border-y border-black/10">
            <div className="min-w-[720px]">
              <ProfileRow label={t('adminSettings.name')} value={city.name} />
              <ProfileRow
                label={t('adminSettings.region')}
                value={city.region}
              />
              <ProfileRow
                label={t('adminSettings.cityProfile.domain')}
                value={domain ?? t('adminSettings.cityProfile.notProvided')}
              />
              <ProfileRow
                label={t('adminSettings.cityProfile.createdAt')}
                value={formatDate(city.createdAt)}
              />
              <ProfileRow
                label={t('adminSettings.cityProfile.updatedAt')}
                value={formatDate(city.updatedAt)}
              />
            </div>
          </div>

          <div className="space-y-2 border-y border-black/10 py-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--primary)]">
                {t('adminSettings.cityProfile.verificationDocumentTitle')}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t('adminSettings.cityProfile.verificationDocumentHelp')}
              </p>
            </div>

            {verificationDocuments.length > 0 ? (
              <FilePreviewList attachments={verificationDocuments} />
            ) : (
              <p className="rounded-md border border-black/10 px-3 py-4 text-sm text-[var(--muted-foreground)]">
                {t('adminSettings.cityProfile.noVerificationDocument')}
              </p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[220px_1fr] border-b border-black/10 px-3 py-2 text-sm last:border-b-0">
      <dt className="font-medium text-[var(--primary-light)]">{label}</dt>
      <dd className="min-w-0 break-words text-[var(--primary)]">{value}</dd>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}
