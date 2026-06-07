'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { cityApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { VerifyDomainModal } from '../../VerifyDomainModal';
import { useDebouncedValue } from '@/hooks';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DomainVerificationToken } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

type CityOption = {
  label: string;
  region: string;
  lat?: number;
  lng?: number;
  geonameId?: number;
};

interface CityInitFormValues {
  name: CityOption | null;
  region: string;
  domain: string;
  document?: FileList;
}

export function CityInitForm() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CityInitFormValues>({ shouldUnregister: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [useDnsVerification, setUseDnsVerification] = useState(false);
  const [domainVerification, setDomainVerification] =
    useState<DomainVerificationToken | null>(null);
  const [verifiedDomain, setVerifiedDomain] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const debouncedCitySearchQuery = useDebouncedValue(citySearchQuery, 600);
  const domainValue = watch('domain');

  useEffect(() => {
    if (debouncedCitySearchQuery.length < 2) {
      setCityOptions([]);
      setCitySearchError('');
      setIsCityLoading(false);
      return;
    }
    const abortController = new AbortController();
    const fetchCities = async () => {
      try {
        setIsCityLoading(true);
        setCitySearchError('');
        const res = await fetch(
          `/api/geonames/cities?q=${encodeURIComponent(debouncedCitySearchQuery)}`,
          { signal: abortController.signal },
        );
        const data = (await res.json()) as {
          message?: string;
          options?: CityOption[];
        };
        if (!res.ok) {
          setCityOptions([]);
          setCitySearchError(data.message || t('cityInit.geonamesLoadError'));
          return;
        }
        const options = data.options || [];
        setCityOptions(options);
        if (options.length === 0) setCitySearchError(t('citySearch.noOptions'));
      } catch (err) {
        if (abortController.signal.aborted) return;
        console.error(t('cityInit.geonamesLoadError'), err);
        setCityOptions([]);
        setCitySearchError(t('cityInit.geonamesLoadError'));
      } finally {
        if (!abortController.signal.aborted) setIsCityLoading(false);
      }
    };
    void fetchCities();
    return () => {
      abortController.abort();
    };
  }, [debouncedCitySearchQuery, t]);

  const onDomainVerify = async () => {
    const domainName = getValues('domain')?.trim().toLowerCase();
    if (!domainName) return;
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) return;
    setIsGeneratingToken(true);
    try {
      const response = await cityApi.generateDomainToken(domainName);
      setDomainVerification(response);
      setVerifiedDomain('');
      setModalOpen(true);
    } catch (error) {
      console.error(t('cityInit.tokenGenerateError'), error);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const submitCityCreationRequest = async () => {
    const values = getValues();
    const files = values.document;
    const document = files?.[0];
    const cityName =
      typeof values.name === 'string' ? values.name : values.name?.label || '';
    const domain = values.domain?.trim().toLowerCase();
    if (!document) return;

    const formData = new FormData();
    formData.append('name', cityName);
    formData.append('region', String(values.region || ''));
    formData.append('document', document);
    if (domain) formData.append('domain', domain);
    if (typeof values.name?.lat === 'number') {
      formData.append('centerLat', String(values.name.lat));
    }
    if (typeof values.name?.lng === 'number') {
      formData.append('centerLng', String(values.name.lng));
    }

    try {
      setSubmitError('');
      setSubmitMessage('');
      await cityApi.initializeCity(formData);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cities.currentCreationRequest(),
      });
      setSubmitMessage(t('cityInit.requestSubmitted'));
    } catch (error) {
      console.error(t('cityInit.initError'), error);
      setSubmitError(
        error instanceof Error ? error.message : t('cityInit.initError'),
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitCityCreationRequest)}
      className="h-full rounded-md border border-black/10 bg-white p-4"
    >
      <div className="grid gap-3">
        <h2 className="text-2xl">{t('cityInit.title')}</h2>
        {submitMessage ? (
          <p className="rounded-md border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success-dark)]">
            {submitMessage}
          </p>
        ) : null}
        {submitError ? (
          <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
            {submitError}
          </p>
        ) : null}

        <div>
          <Controller
            name="name"
            control={control}
            defaultValue={null}
            rules={{ required: t('cityInit.selectCityError') }}
            render={({ field: { value, onChange } }) => (
              <div className="space-y-2">
                <Input
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder={t('cityInit.searchPlaceholder')}
                />
                {isCityLoading ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t('citySearch.loading')}
                  </p>
                ) : null}
                {cityOptions.length > 0 ? (
                  <Select
                    value={
                      value ? `${value.label}|||${value.region}` : undefined
                    }
                    onValueChange={(nextValue) => {
                      const selected = cityOptions.find(
                        (item) =>
                          `${item.label}|||${item.region}` === nextValue,
                      );
                      onChange(selected ?? null);
                      setValue('region', selected?.region || '');
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={t('cityInit.searchLabel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((option) => (
                        <SelectItem
                          key={`${option.label}-${option.region}-${option.geonameId ?? ''}`}
                          value={`${option.label}|||${option.region}`}
                        >
                          {`${option.label} (${option.region})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {citySearchError ? (
                  <p className="text-xs text-[var(--danger-dark)]">
                    {citySearchError}
                  </p>
                ) : null}
              </div>
            )}
          />
          {errors.name ? (
            <p className="mt-1 text-xs text-[var(--danger-dark)]">
              {errors.name.message as string}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--muted-foreground)]">
            {t('cityInit.regionLabel')}
          </label>
          <Input
            {...register('region', {
              required: t('cityInit.regionRequired'),
              minLength: { value: 3, message: t('cityInit.regionMin') },
              maxLength: { value: 50, message: t('cityInit.regionMax') },
              setValueAs: (value: string) => value.trim().replace(/\s+/g, ' '),
              validate: {
                validRegionText: (value: string) =>
                  /^[\p{L}\s'’-]+$/u.test(value) || t('cityInit.regionPattern'),
              },
            })}
            placeholder={t('cityInit.regionPlaceholder')}
          />
          {errors.region ? (
            <p className="mt-1 text-xs text-[var(--danger-dark)]">
              {errors.region.message as string}
            </p>
          ) : null}
        </div>

        <div className="mt-2 rounded-lg border border-black/15 p-3">
          <p className="mb-2 text-lg font-semibold">
            {t('cityInit.representativeTitle')}
          </p>

          <div className="space-y-2">
            <label className="mb-1 block text-sm text-[var(--muted-foreground)]">
              {t('cityInit.domainLabel')}
            </label>
            <Input
              {...register('domain', {
                pattern: {
                  value: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: t('cityInit.domainInvalid'),
                },
                onChange: () => {
                  setDomainVerification(null);
                  setVerifiedDomain('');
                },
              })}
              placeholder={t('cityInit.domainPlaceholder')}
            />
            {errors.domain ? (
              <p className="mt-1 text-xs text-[var(--danger-dark)]">
                {errors.domain.message as string}
              </p>
            ) : null}
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <Checkbox
              checked={useDnsVerification}
              onCheckedChange={(checked) =>
                setUseDnsVerification(Boolean(checked))
              }
            />
            {t('cityInit.dnsToggleLabel')}
          </label>

          {useDnsVerification ? (
            <div className="mt-1 rounded-md bg-black/5 p-3">
              <p className="mb-2 text-sm text-[var(--muted-foreground)]">
                {t('cityInit.dnsHelper')}
              </p>
              {verifiedDomain &&
              verifiedDomain === domainValue?.trim().toLowerCase() ? (
                <p className="mt-2 rounded-md border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success-dark)]">
                  {t('cityInit.domainVerified')}
                </p>
              ) : null}
              <Button
                type="button"
                onClick={onDomainVerify}
                disabled={isGeneratingToken}
                variant="outline"
                className="mt-2 border-[var(--secondary)] text-[var(--secondary)]"
              >
                {isGeneratingToken
                  ? t('cityInit.generateToken')
                  : t('cityInit.verifyDns')}
              </Button>
            </div>
          ) : null}

          <div className="mt-2">
            <p className="mb-1 text-sm">{t('cityInit.documentTitle')}</p>
            <p className="mb-2 text-sm text-[var(--muted-foreground)]">
              {t('cityInit.documentHelp')}
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              {...register('document', {
                required: t('cityInit.documentRequired'),
                validate: {
                  lessThan5MB: (files) =>
                    !files ||
                    files.length === 0 ||
                    files[0]?.size < 5000000 ||
                    t('cityInit.fileSizeError'),
                  acceptedFormats: (files) =>
                    !files ||
                    files.length === 0 ||
                    [
                      'application/pdf',
                      'image/jpeg',
                      'image/png',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    ].includes(files[0]?.type) ||
                    t('cityInit.fileFormatError'),
                },
              })}
              className="w-full cursor-pointer rounded-md border border-black/15 px-3 py-2 text-sm transition-colors file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--secondary)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:border-[var(--secondary)] hover:bg-black/5 focus:border-[var(--secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/20"
            />
            {errors.document ? (
              <p className="mt-1 text-xs text-[var(--danger-dark)]">
                {errors.document.message as string}
              </p>
            ) : null}
          </div>
        </div>

        <Button type="submit" className="mt-1">
          {t('cityInit.submit')}
        </Button>
      </div>

      <VerifyDomainModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        domain={domainVerification?.domain ?? ''}
        token={domainVerification?.token ?? ''}
        onVerified={(result) => {
          setVerifiedDomain(result.domain);
          setDomainVerification({
            id: result.id,
            domain: result.domain,
            token: result.token,
            verifiedAt: result.verifiedAt,
          });
        }}
      />
    </form>
  );
}
