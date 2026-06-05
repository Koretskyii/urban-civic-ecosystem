import { DebouncedSearchInput } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useInfiniteCityMembers,
  useUpdateCityMemberBlockStatus,
  useUpdateCityMemberRole,
} from '@/hooks';
import { CityMember, CityMemberSortBy } from '@/types/city.types';
import { RoleKey } from '@/types/rbac.types';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ALL_ROLES_VALUE, MEMBERS_PAGE_SIZE } from '../../constants';
import { CITY_MEMBER_ROLE_OPTIONS } from '@/features/city-members/constants';

export function MembersSettingsSection({ cityId }: { cityId: string }) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleKey | typeof ALL_ROLES_VALUE>(
    ALL_ROLES_VALUE,
  );
  const [sortBy, setSortBy] = useState<CityMemberSortBy>('joinedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [draftRoles, setDraftRoles] = useState<Record<string, RoleKey>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const tableBodyRef = useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const updateRoleMutation = useUpdateCityMemberRole();
  const updateBlockMutation = useUpdateCityMemberBlockStatus();

  const membersQuery = useInfiniteCityMembers(cityId, {
    search,
    role: role === ALL_ROLES_VALUE ? undefined : role,
    sortBy,
    sortOrder,
    limit: MEMBERS_PAGE_SIZE,
  });

  const members = useMemo(
    () => membersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [membersQuery.data],
  );
  const total = membersQuery.data?.pages[0]?.total ?? members.length;
  const rowCount = membersQuery.hasNextPage
    ? members.length + 1
    : members.length;
  const pendingUserId = updateRoleMutation.variables?.userId ?? '';
  const pendingBlockUserId = updateBlockMutation.variables?.userId ?? '';

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 62,
    overscan: 10,
    scrollMargin,
  });

  useLayoutEffect(() => {
    setScrollMargin(tableBodyRef.current?.offsetTop ?? 0);
  }, [members.length]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const lastVirtualRow = virtualRows[virtualRows.length - 1];

  useEffect(() => {
    if (!lastVirtualRow) return;
    if (lastVirtualRow.index < members.length - 8) return;
    if (!membersQuery.hasNextPage || membersQuery.isFetchingNextPage) return;

    membersQuery.fetchNextPage();
  }, [lastVirtualRow, members.length, membersQuery]);

  const onSave = useCallback(
    async (member: CityMember) => {
      const nextRole = draftRoles[member.userId] ?? member.role;
      if (nextRole === member.role) return;

      setRowError((prev) => ({ ...prev, [member.userId]: '' }));

      try {
        await updateRoleMutation.mutateAsync({
          cityId,
          userId: member.userId,
          role: nextRole,
        });
        setDraftRoles((prev) => {
          const next = { ...prev };
          delete next[member.userId];
          return next;
        });
      } catch (error) {
        setRowError((prev) => ({
          ...prev,
          [member.userId]:
            error instanceof Error
              ? error.message
              : t('cityMembers.updateErrorFallback'),
        }));
      }
    },
    [cityId, draftRoles, t, updateRoleMutation],
  );

  const onToggleBlock = useCallback(
    async (member: CityMember) => {
      setRowError((prev) => ({ ...prev, [member.userId]: '' }));

      try {
        await updateBlockMutation.mutateAsync({
          cityId,
          userId: member.userId,
          isBlocked: !member.isBlocked,
        });
      } catch (error) {
        setRowError((prev) => ({
          ...prev,
          [member.userId]:
            error instanceof Error
              ? error.message
              : t('cityMembers.blockStatusUpdateError'),
        }));
      }
    },
    [cityId, t, updateBlockMutation],
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--primary)]">
            {t('cityMembers.title')}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t('adminSettings.membersTotal', { count: total })}
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-[220px_150px_150px_110px]">
          <DebouncedSearchInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('adminSettings.searchMembers')}
            className="h-10 rounded-md border border-black/10 px-3 text-sm outline-none focus:border-[var(--secondary)]"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as RoleKey)}
            className="h-10 rounded-md border border-black/10 px-3 text-sm outline-none focus:border-[var(--secondary)]"
          >
            <option value={ALL_ROLES_VALUE}>
              {t('adminSettings.allRoles')}
            </option>
            {CITY_MEMBER_ROLE_OPTIONS.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {t(`cityMembers.roles.${roleOption}`)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as CityMemberSortBy)
            }
            className="h-10 rounded-md border border-black/10 px-3 text-sm outline-none focus:border-[var(--secondary)]"
          >
            <option value="joinedAt">{t('cityMembers.joinedAt')}</option>
            <option value="name">{t('adminSettings.name')}</option>
            <option value="email">{t('adminSettings.email')}</option>
          </select>
          <button
            type="button"
            onClick={() =>
              setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
            }
            className="h-10 rounded-md border border-black/10 px-3 text-sm text-[var(--primary)] transition-colors hover:bg-[var(--secondary)]/10"
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>
      </div>

      {membersQuery.isLoading ? (
        <div className="py-6 text-sm text-[var(--muted-foreground)]">
          Loading...
        </div>
      ) : null}

      {membersQuery.isError ? (
        <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
          {t('cityMembers.loadError')}
        </p>
      ) : null}

      {!membersQuery.isLoading && members.length === 0 ? (
        <p className="rounded-md border border-black/10 px-3 py-4 text-sm text-[var(--muted-foreground)]">
          {t('cityMembers.empty')}
        </p>
      ) : null}

      {members.length > 0 ? (
        <div className="overflow-x-auto border-y border-black/10">
          <div className="grid min-w-[980px] grid-cols-[minmax(170px,1.2fr)_minmax(210px,1.3fr)_150px_120px_130px_220px] border-b border-black/10 bg-[var(--surface-1)] px-3 py-2 text-xs font-semibold uppercase text-[var(--primary-light)]">
            <span>{t('adminSettings.name')}</span>
            <span>{t('adminSettings.email')}</span>
            <span>{t('cityMembers.roleLabel')}</span>
            <span>{t('cityMembers.statusLabel')}</span>
            <span>{t('cityMembers.joinedAt')}</span>
            <span>{t('adminSettings.actions')}</span>
          </div>
          <div
            ref={tableBodyRef}
            className="relative min-w-[980px]"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {virtualRows.map((virtualRow) => {
              const member = members[virtualRow.index];

              if (!member) {
                return (
                  <div
                    key={virtualRow.key}
                    className="absolute left-0 top-0 w-full px-3 py-4 text-sm text-[var(--muted-foreground)]"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${
                        virtualRow.start - scrollMargin
                      }px)`,
                    }}
                  >
                    {membersQuery.isFetchingNextPage ? 'Loading...' : null}
                  </div>
                );
              }

              const selectedRole = draftRoles[member.userId] ?? member.role;
              const changed = selectedRole !== member.role;
              const isPending =
                updateRoleMutation.isPending && pendingUserId === member.userId;
              const isBlockPending =
                updateBlockMutation.isPending &&
                pendingBlockUserId === member.userId;
              const isAdmin = member.role === 'admin';

              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 top-0 grid w-full grid-cols-[minmax(170px,1.2fr)_minmax(210px,1.3fr)_150px_120px_130px_220px] items-center gap-2 border-b border-black/10 px-3 py-2 text-sm"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - scrollMargin
                    }px)`,
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--primary)]">
                      {member.name}
                    </p>
                    {rowError[member.userId] ? (
                      <p className="truncate text-xs text-[var(--danger-dark)]">
                        {rowError[member.userId]}
                      </p>
                    ) : null}
                  </div>
                  <span className="truncate text-[var(--muted-foreground)]">
                    {member.email}
                  </span>
                  <Select
                    value={selectedRole}
                    disabled={updateRoleMutation.isPending || member.isBlocked}
                    onValueChange={(value) =>
                      setDraftRoles((prev) => ({
                        ...prev,
                        [member.userId]: value as RoleKey,
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_MEMBER_ROLE_OPTIONS.map((roleOption) => (
                        <SelectItem key={roleOption} value={roleOption}>
                          {t(`cityMembers.roles.${roleOption}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span
                    className={`w-fit rounded-full px-2 py-0.5 text-xs ${
                      member.isBlocked
                        ? 'bg-[var(--danger)]/10 text-[var(--danger-dark)]'
                        : 'bg-[var(--success)]/10 text-[var(--success)]'
                    }`}
                  >
                    {member.isBlocked
                      ? t('cityMembers.blocked')
                      : t('cityMembers.active')}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!changed || isPending || member.isBlocked}
                      onClick={() => onSave(member)}
                      className="h-9 rounded-md bg-[var(--primary)] px-3 text-xs font-semibold text-white disabled:opacity-55"
                    >
                      {isPending
                        ? t('cityMembers.saving')
                        : t('cityMembers.save')}
                    </button>
                    <button
                      type="button"
                      disabled={
                        isBlockPending ||
                        updateRoleMutation.isPending ||
                        (!member.isBlocked && isAdmin)
                      }
                      onClick={() => onToggleBlock(member)}
                      title={
                        !member.isBlocked && isAdmin
                          ? t('cityMembers.adminBlockDisabled')
                          : undefined
                      }
                      className={`h-9 rounded-md px-3 text-xs font-semibold text-white disabled:opacity-55 ${
                        member.isBlocked
                          ? 'bg-[var(--success)]'
                          : 'bg-[var(--danger)]'
                      }`}
                    >
                      {isBlockPending
                        ? t('cityMembers.saving')
                        : member.isBlocked
                          ? t('cityMembers.unblock')
                          : t('cityMembers.block')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
