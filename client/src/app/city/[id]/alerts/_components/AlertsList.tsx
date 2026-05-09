'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import { useCityAlerts } from '@/hooks/useCities';

export default function AlertsList({ cityId }: { cityId: string }) {
  const { data: alerts, isLoading, error } = useCityAlerts(cityId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2 }}>
        Помилка при завантаженні оголошень.
      </Typography>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        Немає активних оголошень.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
      {alerts.map((alert) => {
        const date = new Date(alert.createdAt);
        const formattedDate = date.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const formattedTime = date.toLocaleTimeString('uk-UA', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <Card
            key={alert.id}
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderLeft: '4px solid',
              borderLeftColor: 'warning.main',
              borderRadius: 2,
              bgcolor: 'rgba(255, 186, 8, 0.03)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(255, 186, 8, 0.08)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 186, 8, 0.1)',
                    color: 'warning.dark',
                    display: 'flex',
                  }}
                >
                  <NotificationsActiveRoundedIcon />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}
                  >
                    {alert.content}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
                  >
                    {formattedDate} о {formattedTime}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
