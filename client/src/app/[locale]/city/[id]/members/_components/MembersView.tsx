'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import {
  usePermission,
  useCityMembers,
  useUpdateCityMemberRole,
} from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import type { RoleKey } from '@/types';
import { CITY_MEMBER_ROLE_OPTIONS } from '@/features/city-members';

interface MembersViewProps {
  cityId: string;
}

export default function MembersView({ cityId }: MembersViewProps) {
  const t = useTranslations();
  const { can: canManageRoles, isLoading: isPermissionLoading } = usePermission(
    PERMISSION_GROUPS.ROLE.MANAGE,
    { cityId },
  );

  const membersQuery = useCityMembers(cityId);
  const updateRoleMutation = useUpdateCityMemberRole();
  const [draftRoles, setDraftRoles] = useState<Record<string, RoleKey>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const members = membersQuery.data ?? [];

  const pendingUserId = useMemo(() => {
    const variables = updateRoleMutation.variables;
    if (!variables) {
      return '';
    }
    return variables.userId;
  }, [updateRoleMutation.variables]);
  const isMutating = updateRoleMutation.isPending;

  if (isPermissionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canManageRoles) {
    return <Alert severity="error">{t('forbidden.description')}</Alert>;
  }

  if (membersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (membersQuery.isError) {
    return <Alert severity="error">{t('cityMembers.loadError')}</Alert>;
  }

  const onSave = async (userId: string) => {
    const member = members.find((item) => item.userId === userId);
    if (!member) {
      return;
    }

    const nextRole = draftRoles[userId] ?? member.role;
    if (nextRole === member.role) {
      return;
    }

    setRowError((prev) => ({ ...prev, [userId]: '' }));

    try {
      await updateRoleMutation.mutateAsync({
        cityId,
        userId,
        role: nextRole,
      });
    } catch (error) {
      setRowError((prev) => ({
        ...prev,
        [userId]:
          error instanceof Error
            ? error.message
            : t('cityMembers.updateErrorFallback'),
      }));
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h2">{t('cityMembers.title')}</Typography>
      <Paper sx={{ p: 2 }}>
        {members.length === 0 ? (
          <Typography color="text.secondary">
            {t('cityMembers.empty')}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {members.map((member) => {
              const selectedRole = draftRoles[member.userId] ?? member.role;
              const changed = selectedRole !== member.role;
              const isPending =
                updateRoleMutation.isPending && pendingUserId === member.userId;

              return (
                <Paper key={member.userId} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="subtitle1">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('cityMembers.joinedAt')}:{' '}
                        {new Date(member.joinedAt).toLocaleString()}
                      </Typography>
                    </Box>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                      <TextField
                        select
                        fullWidth
                        label={t('cityMembers.roleLabel')}
                        value={selectedRole}
                        disabled={isMutating}
                        onChange={(event) =>
                          setDraftRoles((prev) => ({
                            ...prev,
                            [member.userId]: event.target.value as RoleKey,
                          }))
                        }
                      >
                        {CITY_MEMBER_ROLE_OPTIONS.map((role) => (
                          <MenuItem key={role} value={role}>
                            {t(`cityMembers.roles.${role}`)}
                          </MenuItem>
                        ))}
                      </TextField>

                      <Button
                        variant="contained"
                        disabled={!changed || isPending || isMutating}
                        onClick={() => onSave(member.userId)}
                      >
                        {isPending
                          ? t('cityMembers.saving')
                          : t('cityMembers.save')}
                      </Button>
                    </Stack>

                    {rowError[member.userId] ? (
                      <Alert severity="error">{rowError[member.userId]}</Alert>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
