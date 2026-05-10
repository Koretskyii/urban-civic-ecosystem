'use client';
import { UCE_COLORS } from '@/theme';
import { useTranslations } from 'next-intl';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

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
        <Toolbar>
          <Typography>{t('app.name')}</Typography>
          <Box>
            <Button>{t('header.authButton')}</Button>
          </Box>
        </Toolbar>
      </HeaderAppBar>
    </HeaderBox>
  );
}
