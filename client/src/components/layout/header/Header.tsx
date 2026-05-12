'use client';

import { useTranslations } from 'next-intl';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from './LocaleSwitcher';
import { useAuthStore } from '@/store';

const HeaderBox = styled(Box)({
  backgroundColor: '#1A3A57',
});
const HeaderAppBar = styled(AppBar)({
  backgroundColor: '#1A3A57',
});

export default function Header() {
  const t = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  console.log(isAuthenticated);

  return (
    <HeaderBox>
      <HeaderAppBar position="sticky">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography
              variant="h6"
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              {t('app.name')}
            </Typography>
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button color="inherit" component={Link} href="/city/create">
              {t('header.createCity')}
            </Button>
            {isAuthenticated ? (
              <Button color="inherit" component={Link} href="/user/profile">
                {t('header.profile')}
              </Button>
            ) : (
              <Button color="inherit" component={Link} href="/user/auth">
                {t('header.signIn')}
              </Button>
            )}
            <LocaleSwitcher />
          </Box>
        </Toolbar>
      </HeaderAppBar>
    </HeaderBox>
  );
}
