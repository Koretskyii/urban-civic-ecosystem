'use client';

import { useRouter } from '@/i18n/navigation';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import FeedRoundedIcon from '@mui/icons-material/FeedRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useCityById, useJoinCity, useRBAC } from '@/hooks';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';

interface CityHomeViewProps {
  cityId: string;
}
const SECTIONS = [
  {
    key: 'news',
    icon: <FeedRoundedIcon sx={{ fontSize: 36 }} />,
    path: '/news',
    color: 'secondary.main',
    bgColor: 'rgba(63, 136, 197, 0.08)',
  },
  {
    key: 'alerts',
    icon: <NotificationsActiveRoundedIcon sx={{ fontSize: 36 }} />,
    path: '/alerts',
    color: 'warning.dark',
    bgColor: 'rgba(255, 186, 8, 0.08)',
  },
  {
    key: 'posts',
    icon: <ArticleRoundedIcon sx={{ fontSize: 36 }} />,
    path: '/posts',
    color: 'success.main',
    bgColor: 'rgba(49, 107, 80, 0.08)',
  },
  {
    key: 'community',
    icon: <GroupsRoundedIcon sx={{ fontSize: 36 }} />,
    path: '/community',
    color: 'secondary.dark',
    bgColor: 'rgba(63, 136, 197, 0.06)',
  },
  {
    key: 'projects',
    icon: <AccountTreeRoundedIcon sx={{ fontSize: 36 }} />,
    path: '/projects',
    color: 'success.dark',
    bgColor: 'rgba(49, 107, 80, 0.06)',
  },
  {
    key: 'problem',
    icon: <ReportProblemRoundedIcon sx={{ fontSize: 36 }} />,
    path: '/problem',
    color: 'error.main',
    bgColor: 'rgba(208, 0, 0, 0.06)',
    featured: true,
  },
];

export default function CityHomeView(props: CityHomeViewProps) {
  const { cityId } = props;
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: city, isLoading } = useCityById(cityId);
  const { permissions, isLoading: isRbacLoading } = useRBAC({ cityId });
  const { mutate: joinCity, isPending: isJoining } = useJoinCity();
  const baseRoute = `/city/${cityId}`;

  const isMember = permissions && permissions.length > 0;

  const handleJoin = () => {
    joinCity(cityId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rbac.permissions(cityId),
        });
      },
    });
  };

  if (isLoading || isRbacLoading || !city) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          mb: 5,
          p: 4,
          borderRadius: 3,
          background: (t) =>
            `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.light} 60%, ${t.palette.secondary.dark} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 3,
          '&::after': {
            content: '""',
            position: 'absolute',
            right: -60,
            top: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <LocationCityRoundedIcon
              sx={{ fontSize: 48, color: 'secondary.light' }}
            />
            <Box>
              <Typography variant="h1" sx={{ color: 'white', lineHeight: 1.1 }}>
                {city.name}
              </Typography>
              <Chip
                label={city.region}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  mt: 0.5,
                }}
              />
            </Box>
          </Box>
          <Typography
            variant="body1"
            sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 520 }}
          >
            {t('cityHome.heroText')}
          </Typography>
        </Box>
        <Box sx={{ zIndex: 1 }}>
          {!isMember ? (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={
                isJoining ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PersonAddRoundedIcon />
                )
              }
              onClick={handleJoin}
              disabled={isJoining}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.3)',
                },
                transition: 'all 0.2s',
              }}
            >
              {t('cityHome.joinCity')}
            </Button>
          ) : (
            <Chip
              icon={<CheckCircleRoundedIcon />}
              label={t('cityHome.joined')}
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                fontWeight: 'bold',
                px: 1,
                py: 2.5,
                borderRadius: 2,
                '& .MuiChip-icon': {
                  color: 'white',
                },
              }}
            />
          )}
        </Box>
      </Box>

      <Typography variant="h3" sx={{ mb: 0.5 }}>
        {t('cityHome.sectionsTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('cityHome.sectionsSubtitle')}
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {/* Navigation cards */}
      <Grid container spacing={3}>
        {SECTIONS.map((section) => (
          <Grid
            key={section.path}
            size={{ xs: 12, sm: 6, lg: section.featured ? 12 : 4 }}
          >
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: '1px solid',
                borderColor: section.featured ? 'error.main' : 'divider',
                borderRadius: 3,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: section.color,
                  boxShadow: `0 4px 20px ${section.bgColor}`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => router.push(`${baseRoute}${section.path}`)}
                sx={{
                  height: '100%',
                  p: 0,
                  borderRadius: 3,
                  '&:hover': { bgcolor: 'transparent' },
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: section.featured
                      ? 'rgba(208, 0, 0, 0.03)'
                      : 'transparent',
                    display: 'flex',
                    flexDirection: section.featured
                      ? { xs: 'column', sm: 'row' }
                      : 'column',
                    alignItems: section.featured
                      ? { sm: 'center' }
                      : 'flex-start',
                    gap: section.featured ? 3 : 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: section.bgColor,
                      color: section.color,
                      display: 'flex',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {section.icon}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        mb: 0.75,
                        color: section.featured ? 'error.main' : 'text.primary',
                        fontWeight: section.featured ? 700 : 'inherit',
                      }}
                    >
                      {t(`cityHome.sections.${section.key}.title`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(`cityHome.sections.${section.key}.description`)}
                    </Typography>
                  </Box>

                  <ArrowForwardRoundedIcon
                    sx={{
                      color: section.color,
                      opacity: 0.6,
                      alignSelf: section.featured ? 'center' : 'flex-end',
                      mt: section.featured ? 0 : 1,
                    }}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
