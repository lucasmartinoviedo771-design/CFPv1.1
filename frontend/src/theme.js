import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Switch MUI to dark mode default
    primary: { main: '#4f46e5' }, // Indigo-600 matching our Tailwind theme
    secondary: { main: '#FF6600' }, // Brand Accent
    background: { default: '#0a0033', paper: '#1e1b4b' },
    text: { primary: '#ffffff', secondary: '#a5b4fc' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#0a0033' }, // Dark background
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: 'rgba(30, 27, 75, 0.5)', // Transparent dark
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backgroundColor: 'rgba(30, 27, 75, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 12, fontWeight: 600 }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
            '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#FF6600' }
          },
          '& .MuiInputLabel-root': { color: '#a5b4fc' },
          '& .MuiInputBase-input': { color: '#ffffff' }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: '#a5b4fc' }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: { backgroundColor: '#1e1b4b', border: '1px solid rgba(99, 102, 241, 0.3)' }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          '&.Mui-selected': { backgroundColor: 'rgba(255, 102, 0, 0.2)', '&:hover': { backgroundColor: 'rgba(255, 102, 0, 0.3)' } }
        }
      }
    },
    MuiTableContainer: { styleOverrides: { root: { borderRadius: 14, backgroundColor: 'transparent' } } },
    MuiTableCell: { styleOverrides: { root: { borderBottom: '1px solid rgba(99, 102, 241, 0.1)', color: '#e0e7ff' }, head: { color: '#818cf8', fontWeight: 700 } } },
  },
});

export default theme;
