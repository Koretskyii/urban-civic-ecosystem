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

  useEffect(() => {
    if (citySearchQuery.length < 2) {
      setCityOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME;

        if (!username) {
          console.error(
            'GeoNames username is not configured. Please set NEXT_PUBLIC_GEONAMES_USERNAME.',
          );
          return;
        }
        const res = await fetch(
          `https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(citySearchQuery)}&country=UA&featureClass=P&maxRows=10&username=${username}&lang=uk`,
        );
        const data = await res.json();

        if (data.geonames) {
          const formattedOptions = data.geonames.map((item: GeoName) => ({
            label: item.name,
            region: item.adminName1 || 'Невідома область',
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
        console.error('Помилка при завантаженні міст з GeoNames', err);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [citySearchQuery]);

  const onSubmit = (data: Record<string, unknown>) => {
    console.log('Form data:', data);
  };

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
      console.error('Помилка при генерації токена:', error);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormGroup sx={{ gap: 3, mt: 2, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Ініціалізація міста
        </Typography>

        <FormControl error={!!errors.name} fullWidth>
          <Controller
            name="name"
            control={control}
            defaultValue={null}
            rules={{ required: 'Оберіть місто зі списку' }}
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
                    label="Пошук міста"
                    variant="standard"
                    error={!!errors.name}
                    placeholder="Почніть вводити назву міста..."
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
            Область
          </InputLabel>
          <Input
            id="region"
            {...register('region', {
              required: "Область є обов'язковою",
              minLength: {
                value: 3,
                message: 'Область має містити принаймні 3 символи',
              },
              maxLength: {
                value: 50,
                message: 'Область не може перевищувати 50 символів',
              },
              pattern: {
                value: /^[а-яА-ЯёЁїЇєЄ\s\-]+$/,
                message: 'Область може містити лише літери, пробіли та дефіси',
              },
            })}
            placeholder="Наприклад: Київська область"
          />
          {errors.region && (
            <FormHelperText>{errors.region.message as string}</FormHelperText>
          )}
        </FormControl>

        <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Верифікація представника
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={useDnsVerification}
                onChange={(e) => setUseDnsVerification(e.target.checked)}
                color="primary"
              />
            }
            label="Перевірка через DNS TXT (Опціонально)"
            sx={{ mb: 2 }}
          />

          {useDnsVerification && (
            <Box sx={{ mt: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Додайте TXT запис зі спеціальним токеном до вашого домену, щоб
                ми могли підтвердити, що ви представляєте офіційний сайт міста.
              </Typography>
              <FormControl error={!!errors.domain} fullWidth sx={{ mb: 2 }}>
                <InputLabel htmlFor="domain">Домен муніципалітету</InputLabel>
                <Input
                  id="domain"
                  {...register('domain', {
                    required: "Домен є обов'язковим для DNS-верифікації",
                    pattern: {
                      value: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message:
                        'Введіть валідний домен (наприклад: kyivcity.gov.ua)',
                    },
                  })}
                  placeholder="Наприклад: kyivcity.gov.ua"
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
                {isGeneratingToken ? 'Генерація токена...' : 'Перевірити DNS'}
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 1 }}>
            <FormLabel sx={{ mb: 1, display: 'block' }}>
              Офіційний документ від муніципалітету
            </FormLabel>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Завантажте скан-копію документа з печаткою та підписом, який дає
              вам право виступати представником цього міста.
            </Typography>
            <FormControl error={!!errors.document} fullWidth>
              <Input
                type="file"
                id="document"
                inputProps={{ accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx' }}
                {...register('document', {
                  required: 'Завантажте документ',
                  validate: {
                    lessThan5MB: (files) =>
                      !files ||
                      files.length === 0 ||
                      files[0]?.size < 5000000 ||
                      'Файл має бути менше 5MB',
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
                      'Тільки PDF, JPG, PNG або DOC(X) формати підтримуються',
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
          Створити простір міста
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
