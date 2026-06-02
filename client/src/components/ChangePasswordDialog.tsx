import React, { useState } from 'react';
import { useChangePassword } from '@/hooks';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        onSuccess: () => handleCancel(),
        onError: () => setGlobalError(t('changePassword.errors.changeFailed')),
      },
    );
  };

  if (!isOpenValue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('changePassword.title')}</h3>
          <Button
            type="button"
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-black/60"
            aria-label="Close"
          >
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {globalError ? (
            <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
              {globalError}
            </p>
          ) : null}

          <PasswordField
            label={t('changePassword.oldLabel')}
            value={oldPassword}
            onChange={setOldPassword}
            showPasswords={showPasswords}
            hasError={false}
          />
          <PasswordField
            label={t('changePassword.newLabel')}
            value={newPassword}
            onChange={setNewPassword}
            showPasswords={showPasswords}
            hasError={confirmPasswordError}
          />
          <PasswordField
            label={t('changePassword.confirmLabel')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            showPasswords={showPasswords}
            hasError={confirmPasswordError}
          />

          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="text-xs text-[var(--muted-foreground)]"
          >
            {showPasswords ? 'Hide' : 'Show'} passwords
          </button>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={handleCancel}
              disabled={changePasswordMutation.isPending}
              variant="ghost"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending
                ? t('changePassword.saving')
                : t('changePassword.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPasswords: boolean;
  hasError: boolean;
}

function PasswordField({
  label,
  value,
  onChange,
  showPasswords,
  hasError,
}: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[var(--muted-foreground)]">
        {label}
      </span>
      <input
        type={showPasswords ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors focus-visible:outline-none ${
          hasError
            ? 'border-[var(--danger-light)] focus:ring-2 focus:ring-[var(--danger-light)]/20'
            : 'border-black/15 focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20'
        }`}
      />
    </label>
  );
}
