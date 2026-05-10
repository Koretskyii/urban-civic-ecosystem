'use client';
import { UCE_COLORS } from '@/theme';
import { useTranslations } from 'next-intl';
import styled from '@emotion/styled';
import { Box, Container, Grid, Typography } from '@mui/material';

const FooterBox = styled(Box)({
  backgroundColor: '#1A3A57',
  color: UCE_COLORS.text.light.primary,
  height: `8rem`,
  padding: `2rem 0rem 2rem 0rem`,
});
const FooterContainer = styled(Container)({
  margin: `0 2rem`,
});

export default function Footer() {
  const t = useTranslations();

  return (
    <FooterBox>
      <FooterContainer>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Typography>{t('footer.rights')}</Typography>
          </Grid>
        </Grid>
      </FooterContainer>
    </FooterBox>
  );
}
