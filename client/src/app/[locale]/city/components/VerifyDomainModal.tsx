'use client';
import { useState } from 'react';
import { cityApi } from '@/api/endpoints';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-xl">
        <h3 className="text-lg font-semibold">{t('verifyDomain.title')}</h3>

        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted-foreground)]">
              {t('verifyDomain.domainLabel')}
            </span>
            <Input value={domain} readOnly />
          </label>

          <div>
            <p className="mb-1 text-sm text-[var(--muted-foreground)]">
              {t('verifyDomain.tokenLabel')}
            </p>
            <div className="flex gap-2">
              <Textarea
                value={token}
                readOnly
                rows={2}
                className="min-h-0 font-mono"
              />
              <Button
                type="button"
                onClick={handleCopyToken}
                variant={copySuccess ? 'default' : 'outline'}
                className={copySuccess ? 'bg-[var(--success)]' : undefined}
              >
                {copySuccess ? '✓' : '⧉'}
              </Button>
            </div>
          </div>

          <div className="h-px bg-black/10" />

          <div>
            <p className="mb-1 text-sm font-semibold">
              {t('verifyDomain.instructionsTitle')}
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
              <li>{t('verifyDomain.stepCopy')}</li>
              <li>{t('verifyDomain.stepAddDns')}</li>
              <li>
                {t('verifyDomain.recordNameLabel')}{' '}
                <code className="rounded bg-black/5 px-1 py-0.5">
                  _urban-civic-verify
                </code>
              </li>
              <li>{t('verifyDomain.recordValueLabel')}</li>
              <li>{t('verifyDomain.stepWait')}</li>
              <li>{t('verifyDomain.stepVerify')}</li>
            </ol>
          </div>

          {error ? (
            <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
              {error}
            </p>
          ) : null}
          {isDomainVerified ? (
            <p className="text-sm text-[var(--success)]">
              {t('verifyDomain.verified')}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            onClick={handleClose}
            disabled={isVerifying}
            variant="ghost"
          >
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? t('common.verifying') : t('common.verify')}
          </Button>
        </div>
      </div>
    </div>
  );
}
