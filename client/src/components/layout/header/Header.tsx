'use client';
import { UCE_COLORS } from '@/theme';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const HeaderBox = styled(Box)({
  backgroundColor: '#1A3A57',
});
const HeaderAppBar = styled(AppBar)({
  backgroundColor: '#1A3A57',
});

export default function Header() {
  return (
    <HeaderBox>
      <HeaderAppBar position='sticky'>
        <Toolbar>
          <Typography>Urban Civic Ecosystem</Typography>
          <Box>
            <Button>Auth</Button>
          </Box>
        </Toolbar>
      </HeaderAppBar>
    </HeaderBox>
  );
}
