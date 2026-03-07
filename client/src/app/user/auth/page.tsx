'use client';

import { useState } from 'react';
import { useLogin, useRegister } from '@/hooks';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tab,
  Tabs,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  PersonAdd as RegisterIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

export default function AuthPage() {
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Hooks
  const login = useLogin();
  const register = useRegister();
  const router = useRouter();

  // Store
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isRegister = tab === 0;
  const isPending = login.isPending || register.isPending;
  const error = login.error || register.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      register.mutate(
        { name, email, password },
        { onSuccess: () => router.push('/user/profile') },
      );
    } else {
      login.mutate(
        { email, password },
        { onSuccess: () => router.push('/user/profile') },
      );
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    login.reset();
    register.reset();
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Typography variant="h2" sx={{ textAlign: 'center', mb: 1 }}>
          Urban Civic
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', mb: 3 }}
        >
          Платформа міської громадської екосистеми
        </Typography>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              fontWeight: 600,
              py: 1.5,
            },
          }}
        >
          <Tab label="Реєстрація" />
          <Tab label="Вхід" />
        </Tabs>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as Error).message}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isRegister && (
              <TextField
                label="Ім'я"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                autoFocus
                autoComplete="name"
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="email"
              autoFocus={!isRegister}
            />
            <TextField
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isPending}
              startIcon={
                isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : isRegister ? (
                  <RegisterIcon />
                ) : (
                  <LoginIcon />
                )
              }
              sx={{ py: 1.5, mt: 1 }}
            >
              {isPending
                ? 'Обробка...'
                : isRegister
                  ? 'Зареєструватися'
                  : 'Увійти'}
            </Button>
          </Box>
        </Box>

        {/* Divider */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            або
          </Typography>
        </Divider>

        {/* Google OAuth */}
        <Button
          variant="outlined"
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          href={`${API_BASE_URL}/auth/google`}
          sx={{
            py: 1.5,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'secondary.main',
              bgcolor: 'secondary.main',
              color: '#fff',
            },
          }}
        >
          Увійти через Google
        </Button>
      </Paper>
    </Container>
  );
}
