import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import {
  Lock as LockIcon,
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useChangePassword } from '@/hooks';
import { useTranslations } from 'next-intl';

interface ChangePasswordDialogProps {
  isOpenValue: boolean;
  setIsOpenValue: (value: boolean) => void;
}

export default function ChangePasswordDialog({
  isOpenValue,
  setIsOpenValue,
}: ChangePasswordDialogProps) {
  const t = useTranslations();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [showPasswords, setShowPasswords] = useState(false);
  const changePasswordMutation = useChangePassword();

  const handleCancel = () => {
    setIsOpenValue(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setConfirmPasswordError(false);
    setGlobalError('');
    setShowPasswords(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setConfirmPasswordError(false);

    if (newPassword === oldPassword) {
      setGlobalError(t('changePassword.errors.sameAsOld'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(true);
      setGlobalError(t('changePassword.errors.mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setGlobalError(t('changePassword.errors.tooShort'));
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword: oldPassword, newPassword },
      {
        onSuccess: () => {
          handleCancel();
        },
        onError: () => {
          setGlobalError(t('changePassword.errors.changeFailed'));
        },
      },
    );
  };

  const handleClickShowPassword = () => setShowPasswords((show) => !show);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const getEndAdornment = () => (
    <InputAdornment position="end">
      <IconButton
        onClick={handleClickShowPassword}
        onMouseDown={handleMouseDownPassword}
        edge="end"
      >
        {showPasswords ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  const getStartAdornment = () => (
    <InputAdornment position="start">
      <LockIcon color="action" fontSize="small" />
    </InputAdornment>
  );

  return (
    <Dialog
      open={isOpenValue}
      onClose={handleCancel}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        {t('changePassword.title')}
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent
          dividers
          sx={{ borderBottom: 'none', borderTop: 'none', pt: 2, pb: 3 }}
        >
          <Stack spacing={2.5}>
            {globalError && (
              <Typography color="error">{globalError}</Typography>
            )}
            <TextField
              fullWidth
              label={t('changePassword.oldLabel')}
              type={showPasswords ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: getStartAdornment(),
                  endAdornment: getEndAdornment(),
                },
              }}
            />
            <TextField
              fullWidth
              label={t('changePassword.newLabel')}
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: getStartAdornment(),
                  endAdornment: getEndAdornment(),
                },
              }}
              error={confirmPasswordError}
            />
            <TextField
              fullWidth
              label={t('changePassword.confirmLabel')}
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: getStartAdornment(),
                  endAdornment: getEndAdornment(),
                },
              }}
              error={confirmPasswordError}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button
            onClick={handleCancel}
            color="inherit"
            disabled={changePasswordMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending
              ? t('changePassword.saving')
              : t('changePassword.submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
