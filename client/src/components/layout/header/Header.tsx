'use client';

import { useTranslations } from 'next-intl';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import LocaleSwitcher from './LocaleSwitcher';

const HeaderBox = styled(Box)({
  backgroundColor: '#1A3A57',
});
const HeaderAppBar = styled(AppBar)({
  backgroundColor: '#1A3A57',
});

export default function Header() {
  const t = useTranslations();

  return (
    <HeaderBox>
      <HeaderAppBar position="sticky">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography>{t('app.name')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocaleSwitcher />
            <Button color="inherit">{t('header.authButton')}</Button>
          </Box>
        </Toolbar>
      </HeaderAppBar>
    </HeaderBox>
  );
}
