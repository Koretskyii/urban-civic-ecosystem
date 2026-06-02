'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useNotificationsRealtime,
  useUnreadNotificationsCount,
} from '@/hooks';
import { useAuthStore } from '@/store';
import type { InAppNotification } from '@/types';

function useCurrentCityIdFromPath() {
  const pathname = usePathname();

  return useMemo(() => {
    const match = pathname.match(/^\/city\/([^/]+)/);
    return match?.[1];
  }, [pathname]);
}

export default function HeaderNotifications() {
  const t = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cityId = useCurrentCityIdFromPath();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useNotificationsRealtime(cityId);

  const { data: unreadCount } = useUnreadNotificationsCount(cityId);
  const { data: notifications } = useNotificationsList(cityId, false);
  const markRead = useMarkNotificationRead(cityId);
  const markAllRead = useMarkAllNotificationsRead(cityId);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const formatNotificationDescription = (item: InAppNotification) => {
    const isNews = item.type.startsWith('NEWS_');
    const isCreated = item.type.endsWith('_CREATED');
    const isUpdated = item.type.endsWith('_UPDATED');
    const isDeleted = item.type.endsWith('_DELETED');

    const entityLabel = isNews
      ? t('header.notificationEntityNews')
      : t('header.notificationEntityAlert');

    const actionLabel = isCreated
      ? t('header.notificationActionCreated')
      : isUpdated
        ? t('header.notificationActionUpdated')
        : isDeleted
          ? t('header.notificationActionDeleted')
          : t('header.notificationActionChanged');

    const createdAt = new Date(item.createdAt).toLocaleString();
    const payload = (item.payload ?? {}) as Record<string, unknown>;
    const severity =
      typeof payload.severity === 'string' ? payload.severity : null;
    const alertTypeId =
      typeof payload.alertTypeId === 'string' ? payload.alertTypeId : null;
    const details = [severity, alertTypeId].filter(Boolean).join(' • ');

    return {
      primary: `${actionLabel} ${entityLabel}`,
      title: item.title,
      details: details || null,
      createdAt,
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-md p-2 text-[var(--primary)] transition-colors hover:bg-[var(--secondary)]/12"
        aria-label={t('header.notifications')}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {(unreadCount?.count ?? 0) > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold leading-none text-white">
            {Math.min(unreadCount?.count ?? 0, 99)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(95vw,22.5rem)] rounded-lg border border-black/10 bg-white text-black shadow-lg">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-sm font-bold">{t('header.notifications')}</p>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs text-[var(--primary-light)] transition-opacity disabled:opacity-50"
            >
              {t('header.markAllRead')}
            </button>
          </div>

          <ul className="max-h-[23.75rem] overflow-y-auto">
            {notifications?.items.length ? (
              notifications.items.map((item) => {
                const content = formatNotificationDescription(item);
                return (
                  <li
                    key={item.id}
                    className={`border-t border-black/5 px-4 py-3 ${
                      item.isRead ? 'bg-transparent' : 'bg-[#1A3A5714]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 pr-2">
                        <p
                          className={`text-sm ${item.isRead ? 'font-normal' : 'font-bold'}`}
                        >
                          {content.primary}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-sm leading-5">{content.title}</p>
                          {content.details ? (
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {content.details}
                            </p>
                          ) : null}
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {content.createdAt}
                          </p>
                        </div>
                      </div>
                      {!item.isRead ? (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(item.id)}
                          disabled={markRead.isPending}
                          className="max-w-20 shrink-0 whitespace-normal text-right text-xs leading-tight text-[var(--primary-light)] transition-opacity disabled:opacity-50"
                        >
                          {t('header.markRead')}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="border-t border-black/5 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                {t('header.noNotifications')}
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
