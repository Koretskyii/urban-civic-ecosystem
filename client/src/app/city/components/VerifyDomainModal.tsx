'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { cityApi } from '@/api/endpoints';

interface VerifyDomainModalProps {
  open: boolean;
  onClose: () => void;
  domain: string;
  token: string;
}

export function VerifyDomainModal({
  open,
  onClose,
  domain,
  token,
}: VerifyDomainModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      await cityApi.verifyDomain({ domain, token });
      // Success - close the modal
      onClose();
    } catch (err) {
      setError(
        (err as Error).message ||
          'Не вдалося перевірити домен. Переконайтеся, що TXT запис додано правильно.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    if (!isVerifying) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Верифікація домену</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="Домен"
            value={domain}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
            variant="outlined"
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Токен для DNS TXT запису
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                value={token}
                fullWidth
                multiline
                rows={2}
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                }}
                variant="outlined"
              />
              <IconButton
                onClick={handleCopyToken}
                color={copySuccess ? 'success' : 'primary'}
                sx={{ mt: 0.5 }}
              >
                {copySuccess ? <CheckCircleIcon /> : <ContentCopyIcon />}
              </IconButton>
            </Box>
          </Box>

          <Divider />

          {/* Instructions */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Інструкція:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Скопіюйте токен вище, натиснувши кнопку копіювання</li>
                <li>Додайте TXT запис до DNS налаштувань вашого домену</li>
                <li>
                  Назва запису:{' '}
                  <code
                    style={{
                      background: '#f5f5f5',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    _urban-civic-verify
                  </code>
                </li>
                <li>Значення запису: вставте скопійований токен</li>
                <li>Зачекайте 5-10 хвилин для поширення DNS</li>
                <li>Натисніть &ldquo;Перевірити&rdquo; для підтвердження</li>
              </ol>
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isVerifying}>
          Скасувати
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          color="primary"
          disabled={isVerifying}
          startIcon={isVerifying && <CircularProgress size={16} />}
        >
          {isVerifying ? 'Перевірка...' : 'Перевірити'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
