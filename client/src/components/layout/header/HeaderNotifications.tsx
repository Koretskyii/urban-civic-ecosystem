'use client';

import { useMemo, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography as MuiTypography,
  Typography,
} from '@mui/material';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
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

  useNotificationsRealtime(cityId);

  const { data: unreadCount } = useUnreadNotificationsCount(cityId);
  const { data: notifications } = useNotificationsList(cityId, false);
  const markRead = useMarkNotificationRead(cityId);
  const markAllRead = useMarkAllNotificationsRead(cityId);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
    <>
      <IconButton
        color="inherit"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <Badge color="error" badgeContent={unreadCount?.count ?? 0} max={99}>
          <NotificationsNoneRoundedIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 360, maxWidth: '95vw' } }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {t('header.notifications')}
          </Typography>
          <MenuItem
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            sx={{ minHeight: 'unset', p: 0, fontSize: 13 }}
          >
            {t('header.markAllRead')}
          </MenuItem>
        </Box>

        <List sx={{ py: 0, maxHeight: 380, overflowY: 'auto' }}>
          {notifications?.items.length ? (
            notifications.items.map((item) => {
              const content = formatNotificationDescription(item);
              return (
                <ListItem
                  key={item.id}
                  divider
                  sx={{
                    alignItems: 'flex-start',
                    bgcolor: item.isRead
                      ? 'transparent'
                      : 'rgba(26,58,87,0.08)',
                  }}
                  secondaryAction={
                    item.isRead ? null : (
                      <MenuItem
                        onClick={() => markRead.mutate(item.id)}
                        disabled={markRead.isPending}
                        sx={{ minHeight: 'unset', p: 0, fontSize: 12 }}
                      >
                        {t('header.markRead')}
                      </MenuItem>
                    )
                  }
                >
                  <ListItemText
                    primary={content.primary}
                    secondary={
                      <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                        <MuiTypography variant="body2" sx={{ fontSize: 14 }}>
                          {content.title}
                        </MuiTypography>
                        {content.details ? (
                          <MuiTypography
                            variant="caption"
                            color="text.secondary"
                          >
                            {content.details}
                          </MuiTypography>
                        ) : null}
                        <MuiTypography variant="caption" color="text.secondary">
                          {content.createdAt}
                        </MuiTypography>
                      </Stack>
                    }
                    primaryTypographyProps={{
                      fontWeight: item.isRead ? 400 : 700,
                      pr: 6,
                    }}
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              );
            })
          ) : (
            <ListItem>
              <ListItemText
                primary={t('header.noNotifications')}
                primaryTypographyProps={{ color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </Menu>
    </>
  );
}
