import { createTheme } from '@mui/material';
import { PaletteColorOptions, PaletteColor } from '@mui/material/styles';
import { Didact_Gothic } from 'next/font/google';

declare module '@mui/material/styles' {
  interface PaletteOptions {
    ember?: PaletteColorOptions;
    flame?: PaletteColorOptions;
    green?: PaletteColorOptions;
  }
  interface Palette {
    ember: PaletteColor;
    flame: PaletteColor;
    green: PaletteColor;
  }
}

export const UCE_COLORS = {
  deepBlue: {
    main: '#0C263D',
    light: '#1A3A57',
    dark: '#061829',
  },
  steelBlue: {
    main: '#3F88C5',
    light: '#6BA3D6',
    dark: '#2D6A9F',
  },
  brickEmber: {
    main: '#D00000',
    light: '#E04040',
    dark: '#9B0000',
  },
  amberFlame: {
    main: '#FFBA08',
    light: '#FFCB45',
    dark: '#CC9500',
  },
  turfGreen: {
    main: '#316B50',
    light: '#4A8A6C',
    dark: '#234D39',
  },
  text: {
    light: {
      primary: '#FFFFFF',
      secondary: '#E0E0E0',
    },
    dark: {
      primary: '#000000de',
      secondary: '#00000099',
    },
  },
};

const didactGothic = Didact_Gothic({
  weight: '400',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      ...UCE_COLORS.deepBlue,
    },
    secondary: {
      ...UCE_COLORS.steelBlue,
    },
    error: {
      ...UCE_COLORS.brickEmber,
    },
    warning: {
      ...UCE_COLORS.amberFlame,
    },
    success: {
      ...UCE_COLORS.turfGreen,
    },

    // accent colors
    ember: {
      ...UCE_COLORS.brickEmber,
    },
    flame: {
      ...UCE_COLORS.amberFlame,
    },
    green: {
      ...UCE_COLORS.turfGreen,
    },
  },

  typography: {
    fontFamily: didactGothic.style.fontFamily,
    h1: {
      fontSize: '2.5rem',
      fontWeight: didactGothic.style.fontWeight,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: didactGothic.style.fontWeight,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: didactGothic.style.fontWeight,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: didactGothic.style.fontWeight,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: didactGothic.style.fontWeight,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: didactGothic.style.fontWeight,
    },
    button: {
      fontSize: '1rem',
      fontWeight: didactGothic.style.fontWeight,
      textTransform: 'none' as const,
    },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
      },
    },
  },
});
