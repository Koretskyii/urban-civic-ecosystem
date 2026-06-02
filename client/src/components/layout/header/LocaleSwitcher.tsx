'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Select value={locale} onValueChange={onSelectChange} disabled={isPending}>
      <SelectTrigger className="h-9 min-w-20 border-[var(--secondary)]/35 px-2 pr-2 focus:ring-[var(--secondary)]/20">
        <SelectValue placeholder="Locale" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="uk">UK</SelectItem>
        <SelectItem value="en">EN</SelectItem>
      </SelectContent>
    </Select>
  );
}
