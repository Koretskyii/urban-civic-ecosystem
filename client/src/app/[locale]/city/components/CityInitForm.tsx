'use client';
import { useState, useEffect } from 'react';
import {
  Button,
  FormControl,
  FormGroup,
  Input,
  InputLabel,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  FormLabel,
  FormHelperText,
  Autocomplete,
  TextField,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { cityApi } from '@/api/endpoints';
import { VerifyDomainModal } from './VerifyDomainModal';
import { useAuthStore } from '@/store';
import { useDebouncedValue } from '@/hooks';
import { useTranslations } from 'next-intl';

type CityOption = {
  label: string;
  region: string;
};

interface DomainToken {
  token: string;
}

interface CityInitFormValues {
  name: CityOption | null;
  region: string;
  domain?: string;
  document?: FileList;
}

export function CityInitForm() {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CityInitFormValues>({ shouldUnregister: true });
  const [useDnsVerification, setUseDnsVerification] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const debouncedCitySearchQuery = useDebouncedValue(citySearchQuery, 600);

  const user = useAuthStore((state) => state.user);

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
        if (options.length === 0) {
          setCitySearchError(t('citySearch.noOptions'));
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error(t('cityInit.geonamesLoadError'), err);
        setCityOptions([]);
        setCitySearchError(t('cityInit.geonamesLoadError'));
      } finally {
        if (!abortController.signal.aborted) {
          setIsCityLoading(false);
        }
      }
    };

    void fetchCities();

    return () => {
      abortController.abort();
    };
  }, [debouncedCitySearchQuery, t]);

  const onDomainVerify = async () => {
    const domainName = getValues('domain');
    if (!domainName) {
      return;
    }

    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
      return;
    }

    setIsGeneratingToken(true);
    try {
      const response = (await cityApi.generateDomainToken(
        domainName,
      )) as DomainToken;
      setVerificationToken(response.token);
      setModalOpen(true);
    } catch (error) {
      console.error(t('cityInit.tokenGenerateError'), error);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const initializeCityEnvironment = async () => {
    const values = getValues();
    const files = values.document;
    const document = files?.[0];
    const cityName =
      typeof values.name === 'string' ? values.name : values.name?.label || '';

    if (!document) {
      return;
    }

    const formData = new FormData();
    formData.append('name', cityName);
    formData.append('region', String(values.region || ''));
    formData.append('document', document);

    if (values.domain) {
      formData.append('domain', String(values.domain));
    }

    if (user?.id) {
      formData.append('userId', user.id);
    }

    try {
      await cityApi.initializeCity(formData);
    } catch (error) {
      console.error(t('cityInit.initError'), error);
    }
  };

  return (
    <form onSubmit={handleSubmit(initializeCityEnvironment)}>
      <FormGroup sx={{ gap: 3, mt: 2, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {t('cityInit.title')}
        </Typography>

        <FormControl error={!!errors.name} fullWidth>
          <Controller
            name="name"
            control={control}
            defaultValue={null}
            rules={{ required: t('cityInit.selectCityError') }}
            render={({ field: { value, onChange, ...field } }) => (
              <Autocomplete<CityOption, false, false, false>
                {...field}
                value={value || null}
                inputValue={citySearchQuery}
                options={cityOptions}
                isOptionEqualToValue={(option, selected) =>
                  option.label === selected.label &&
                  option.region === selected.region
                }
                openOnFocus
                loading={isCityLoading}
                noOptionsText={
                  citySearchQuery.length < 2
                    ? t('cityInit.searchPlaceholder')
                    : citySearchError || t('citySearch.noOptions')
                }
                filterOptions={(options) => options}
                getOptionLabel={(option: string | CityOption) =>
                  typeof option === 'string'
                    ? option
                    : `${option.label} (${option.region})`
                }
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input' || reason === 'clear') {
                    setCitySearchQuery(newInputValue);
                  }
                }}
                onChange={(_, newValue: CityOption | null) => {
                  onChange(newValue);
                  setValue('region', newValue?.region || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('cityInit.searchLabel')}
                    variant="standard"
                    error={!!errors.name}
                    placeholder={t('cityInit.searchPlaceholder')}
                  />
                )}
              />
            )}
          />
          {errors.name && (
            <FormHelperText>{errors.name.message as string}</FormHelperText>
          )}
        </FormControl>

        <FormControl error={!!errors.region} fullWidth variant="standard">
          <InputLabel htmlFor="region" shrink>
            {t('cityInit.regionLabel')}
          </InputLabel>
          <Input
            id="region"
            {...register('region', {
              required: t('cityInit.regionRequired'),
              minLength: {
                value: 3,
                message: t('cityInit.regionMin'),
              },
              maxLength: {
                value: 50,
                message: t('cityInit.regionMax'),
              },
              setValueAs: (value: string) => value.trim().replace(/\s+/g, ' '),
              validate: {
                validRegionText: (value: string) =>
                  /^[\p{L}\s'’-]+$/u.test(value) || t('cityInit.regionPattern'),
              },
            })}
            placeholder={t('cityInit.regionPlaceholder')}
          />
          {errors.region && (
            <FormHelperText>{errors.region.message as string}</FormHelperText>
          )}
        </FormControl>

        <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('cityInit.representativeTitle')}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={useDnsVerification}
                onChange={(e) => setUseDnsVerification(e.target.checked)}
                color="primary"
              />
            }
            label={t('cityInit.dnsToggleLabel')}
            sx={{ mb: 2 }}
          />

          {useDnsVerification && (
            <Box sx={{ mt: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('cityInit.dnsHelper')}
              </Typography>
              <FormControl error={!!errors.domain} fullWidth sx={{ mb: 2 }}>
                <InputLabel htmlFor="domain">
                  {t('cityInit.domainLabel')}
                </InputLabel>
                <Input
                  id="domain"
                  {...register('domain', {
                    required: t('cityInit.domainRequired'),
                    pattern: {
                      value: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: t('cityInit.domainInvalid'),
                    },
                  })}
                  placeholder={t('cityInit.domainPlaceholder')}
                />
                {errors.domain && (
                  <FormHelperText>
                    {errors.domain.message as string}
                  </FormHelperText>
                )}
              </FormControl>
              <Button
                variant="outlined"
                color="secondary"
                type="button"
                onClick={onDomainVerify}
                disabled={isGeneratingToken}
              >
                {isGeneratingToken
                  ? t('cityInit.generateToken')
                  : t('cityInit.verifyDns')}
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 1 }}>
            <FormLabel sx={{ mb: 1, display: 'block' }}>
              {t('cityInit.documentTitle')}
            </FormLabel>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('cityInit.documentHelp')}
            </Typography>
            <FormControl error={!!errors.document} fullWidth>
              <Input
                type="file"
                id="document"
                inputProps={{ accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx' }}
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
              />
              {errors.document && (
                <FormHelperText>
                  {errors.document.message as string}
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          type="submit"
          size="large"
          sx={{ mt: 1 }}
        >
          {t('cityInit.submit')}
        </Button>
      </FormGroup>

      <VerifyDomainModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        domain={getValues('domain') || ''}
        token={verificationToken}
      />
    </form>
  );
}
