'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  usePermission,
  useCityMembers,
  useUpdateCityMemberRole,
} from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import type { RoleKey } from '@/types';
import { CITY_MEMBER_ROLE_OPTIONS } from '@/features/city-members';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const members = membersQuery.data?.items ?? [];
  const pendingUserId = useMemo(() => {
    const variables = updateRoleMutation.variables;
    if (!variables) return '';
    return variables.userId;
  }, [updateRoleMutation.variables]);
  const isMutating = updateRoleMutation.isPending;

  if (isPermissionLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
        {t('forbidden.description')}
      </p>
    );
  }

  if (membersQuery.isLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (membersQuery.isError) {
    return (
      <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
        {t('cityMembers.loadError')}
      </p>
    );
  }

  const onSave = async (userId: string) => {
    const member = members.find((item) => item.userId === userId);
    if (!member) return;

    const nextRole = draftRoles[userId] ?? member.role;
    if (nextRole === member.role) return;

    setRowError((prev) => ({ ...prev, [userId]: '' }));

    try {
      await updateRoleMutation.mutateAsync({ cityId, userId, role: nextRole });
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
    <div className="space-y-3">
      <h2 className="text-3xl">{t('cityMembers.title')}</h2>
      <div className="rounded-lg border border-black/10 bg-white p-3">
        {members.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {t('cityMembers.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const selectedRole = draftRoles[member.userId] ?? member.role;
              const changed = selectedRole !== member.role;
              const isPending =
                updateRoleMutation.isPending && pendingUserId === member.userId;

              return (
                <div
                  key={member.userId}
                  className="rounded-lg border border-black/10 p-3"
                >
                  <div className="mb-2">
                    <p className="text-base">{member.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {member.email}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t('cityMembers.joinedAt')}:{' '}
                      {new Date(member.joinedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <Select
                      value={selectedRole}
                      disabled={isMutating}
                      onValueChange={(value) =>
                        setDraftRoles((prev) => ({
                          ...prev,
                          [member.userId]: value as RoleKey,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CITY_MEMBER_ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`cityMembers.roles.${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      disabled={!changed || isPending || isMutating}
                      onClick={() => onSave(member.userId)}
                      className="h-10 rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isPending
                        ? t('cityMembers.saving')
                        : t('cityMembers.save')}
                    </button>
                  </div>

                  {rowError[member.userId] ? (
                    <p className="mt-2 rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
                      {rowError[member.userId]}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
