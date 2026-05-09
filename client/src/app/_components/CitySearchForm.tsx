'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, TextField, Button, Autocomplete, CircularProgress, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useCities } from '@/hooks';
import { City } from '@/types';

export default function CitySearchForm() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const router = useRouter();
  const { data: cities = [], isLoading } = useCities();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCity) {
      router.push(`/city/${selectedCity.id}`);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <Typography variant="h4" fontWeight={700}>
        Оберіть своє місто з переліку
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
      >
        <Autocomplete
          options={cities}
          getOptionLabel={(option) => `${option.name} (${option.region})`}
          value={selectedCity}
          onChange={(event, newValue) => {
            setSelectedCity(newValue);
          }}
          loading={isLoading}
          sx={{ minWidth: 300 }}
          noOptionsText="Міст не знайдено"
          loadingText="Завантаження..."
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Оберіть місто"
              size="medium"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          sx={{ height: 56 }}
          disabled={isLoading}
        >
          Обрати
        </Button>
      </Box>
    </Box>
  );
}
