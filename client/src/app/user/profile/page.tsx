'use client';

import { useCurrentUser, useLogout } from '@/hooks';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Avatar,
  Paper,
  Divider,
  Chip,
  Button,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Shield as ShieldIcon,
  Logout as LogoutIcon,
  Google as GoogleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { theme } from '@/theme';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ProfileSkeleton() {
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Skeleton variant="circular" width={96} height={96} />
          <Skeleton variant="text" width={180} height={40} />
          <Skeleton variant="text" width={220} height={24} />
        </Box>
        <Divider sx={{ my: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={56}
            sx={{ mb: 1.5, borderRadius: 2 }}
          />
        ))}
      </Paper>
    </Container>
  );
}

export default function UserProfilePage() {
  const { data: profile, isLoading } = useCurrentUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.replace('/auth-test'),
    });
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated || !profile) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ShieldIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h3" gutterBottom>
            Необхідна авторизація
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Увійдіть, щоб переглянути профіль
          </Typography>
          <Button variant="contained" onClick={() => router.push('/auth-test')}>
            Увійти
          </Button>
        </Paper>
      </Container>
    );
  }

  const isGoogleUser = profile.provider === 'google';

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      {/* Header card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}12 100%)`,
        }}
      >
        {/* Avatar + Name */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 96,
              height: 96,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(12, 38, 61, 0.25)',
            }}
          >
            {getInitials(profile.name)}
          </Avatar>

          <Typography variant="h2" sx={{ textAlign: 'center' }}>
            {profile.name}
          </Typography>

          <Chip
            icon={isGoogleUser ? <GoogleIcon /> : <LockIcon />}
            label={isGoogleUser ? 'Google аккаунт' : 'Локальний аккаунт'}
            size="small"
            variant="outlined"
            sx={{
              borderColor: isGoogleUser ? 'secondary.main' : 'success.main',
              color: isGoogleUser ? 'secondary.dark' : 'success.dark',
              '& .MuiChip-icon': {
                color: 'inherit',
                fontSize: 16,
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Info rows */}
        <Stack spacing={1.5}>
          <InfoRow icon={<EmailIcon />} label="Email" value={profile.email} />
          <InfoRow icon={<PersonIcon />} label="ID" value={profile.id} mono />
          {profile.createdAt && (
            <InfoRow
              icon={<CalendarIcon />}
              label="Зареєстровано"
              value={formatDate(profile.createdAt)}
            />
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Action buttons */}
        <Stack spacing={1.5}>
          {!isGoogleUser && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LockIcon />}
              onClick={() => router.push('/user/change-password')}
              sx={{ py: 1.2 }}
            >
              Змінити пароль
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            disabled={logout.isPending}
            sx={{ py: 1.2 }}
          >
            {logout.isPending ? 'Вихід...' : 'Вийти з аккаунту'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ color: 'secondary.main', display: 'flex' }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.2 }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: mono ? 'monospace' : 'inherit',
            fontSize: mono ? '0.8rem' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
