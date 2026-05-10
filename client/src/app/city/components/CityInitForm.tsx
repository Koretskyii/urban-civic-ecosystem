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
import { useTranslations } from 'next-intl';

type CityOption = {
  label: string;
  region: string;
};

interface GeoName {
  name: string;
  adminName1?: string;
}

interface DomainToken {
  token: string;
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
  } = useForm({ shouldUnregister: true });
  const [useDnsVerification, setUseDnsVerification] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (citySearchQuery.length < 2) {
      setCityOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME;

        if (!username) {
          console.error(t('cityInit.geonamesMissing'));
          return;
        }
        const res = await fetch(
          `https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(citySearchQuery)}&country=UA&featureClass=P&maxRows=10&username=${username}&lang=uk`,
        );
        const data = await res.json();

        if (data.geonames) {
          const formattedOptions = data.geonames.map((item: GeoName) => ({
            label: item.name,
            region: item.adminName1 || t('cityInit.unknownRegion'),
          }));

          const uniqueOptions = Array.from(
            new Set(
              formattedOptions.map((a: CityOption) => a.label + a.region),
            ),
          )
            .map((id) =>
              formattedOptions.find(
                (a: CityOption) => a.label + a.region === id,
              ),
            )
            .filter((item): item is CityOption => item !== undefined);

          setCityOptions(uniqueOptions || []);
        }
      } catch (err) {
        console.error(t('cityInit.geonamesLoadError'), err);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [citySearchQuery]);

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
    const files = values.document as FileList | undefined;
    const document = files?.[0];

    if (!document) {
      return;
    }

    const formData = new FormData();
    formData.append('name', String(values.name || ''));
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
              <Autocomplete
                {...field}
                value={value || null}
                options={cityOptions}
                getOptionLabel={(option: string | CityOption) =>
                  typeof option === 'string'
                    ? option
                    : `${option.label} (${option.region})`
                }
                onInputChange={(_, newInputValue) =>
                  setCitySearchQuery(newInputValue)
                }
                onChange={(_, newValue: string | CityOption | null) => {
                  if (typeof newValue === 'string') {
                    onChange(newValue);
                    setValue('region', '');
                  } else {
                    onChange(newValue?.label || '');
                    setValue('region', newValue?.region || '');
                  }
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
              pattern: {
                value: /^[а-яА-ЯёЁїЇєЄ\s\-]+$/,
                message: t('cityInit.regionPattern'),
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
