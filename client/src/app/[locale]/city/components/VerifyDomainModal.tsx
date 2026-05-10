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
import { useTranslations } from 'next-intl';

interface VerifyDomainModalProps {
  open: boolean;
  onClose: () => void;
  domain: string;
  token: string;
}
interface VerifyDomainResponse {
  data: {
    success: boolean;
  };
}

export function VerifyDomainModal({
  open,
  onClose,
  domain,
  token,
}: VerifyDomainModalProps) {
  const t = useTranslations();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDomainVerified, setIsDomainVerified] = useState(false);

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
      const response: VerifyDomainResponse = (await cityApi.verifyDomain({
        domain,
        token,
      })) as VerifyDomainResponse;
      // Success - close the modal
      if (response?.data?.success) {
        onClose();
        setIsDomainVerified(true);
      }
    } catch (err) {
      setError((err as Error).message || t('verifyDomain.errorFallback'));
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
        <Typography variant="h6">{t('verifyDomain.title')}</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label={t('verifyDomain.domainLabel')}
            value={domain}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
            variant="outlined"
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('verifyDomain.tokenLabel')}
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

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              {t('verifyDomain.instructionsTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>{t('verifyDomain.stepCopy')}</li>
                <li>{t('verifyDomain.stepAddDns')}</li>
                <li>
                  {t('verifyDomain.recordNameLabel')}{' '}
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
                <li>{t('verifyDomain.recordValueLabel')}</li>
                <li>{t('verifyDomain.stepWait')}</li>
                <li>{t('verifyDomain.stepVerify')}</li>
              </ol>
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Box>
        {isDomainVerified && (
          <Box sx={{ color: 'success.main' }}>{t('verifyDomain.verified')}</Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isVerifying}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          color="primary"
          disabled={isVerifying}
          startIcon={isVerifying && <CircularProgress size={16} />}
        >
          {isVerifying ? t('common.verifying') : t('common.verify')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
