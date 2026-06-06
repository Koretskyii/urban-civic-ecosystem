import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminUsers,
  useCurrentUser,
  useUpdateUserSystemRole,
} from '@/hooks';
import type { AdminUser, SystemRole } from '@/types';
import { AdminCell, AdminTable } from '../../AdminTable/AdminTable';
import { AdminToolbar } from '../../AdminToolbar/AdminToolbar';
import { PaginationControls } from '../../PaginationControls/PaginationControls';
import { TableState } from '../../TableState/TableState';

const SYSTEM_ROLES = ['USER', 'ADMIN'] as const;
const ADMIN_PAGE_SIZE = 25;
const USER_COLUMNS = 'grid-cols-[24%_34%_16%_10%_16%]';

export function UsersSection() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [systemRole, setSystemRole] = useState<SystemRole | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const query = useAdminUsers({
    search,
    systemRole: systemRole === 'ALL' ? undefined : systemRole,
    page,
    limit: ADMIN_PAGE_SIZE,
  });
  const currentUser = useCurrentUser();
  const updateRole = useUpdateUserSystemRole();
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <section className="space-y-3">
      <AdminToolbar title={t('platformAdmin.users.title')} total={total}>
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder={t('platformAdmin.search')}
          className="h-10 md:w-64"
        />
        <select
          value={systemRole}
          onChange={(event) => {
            setSystemRole(event.target.value as SystemRole | 'ALL');
            setPage(1);
          }}
          className="h-10 rounded-md border border-black/10 px-3 text-sm outline-none"
        >
          <option value="ALL">{t('platformAdmin.allRoles')}</option>
          {SYSTEM_ROLES.map((item) => (
            <option key={item} value={item}>
              {t(`platformAdmin.systemRoles.${item}`)}
            </option>
          ))}
        </select>
      </AdminToolbar>

      <TableState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={items.length === 0}
      />

      {items.length > 0 ? (
        <>
          <AdminTable
            minWidth="900px"
            columns={USER_COLUMNS}
            headers={[
              t('platformAdmin.name'),
              t('platformAdmin.email'),
              t('platformAdmin.role'),
              t('platformAdmin.memberships'),
              t('platformAdmin.actions'),
            ]}
          >
            {items.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUser.data?.id}
                isPending={updateRole.isPending}
                onRoleChange={(nextRole) =>
                  updateRole.mutate({ id: user.id, systemRole: nextRole })
                }
              />
            ))}
          </AdminTable>
          <PaginationControls
            page={page}
            limit={ADMIN_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </section>
  );
}

function UserRow({
  user,
  isCurrentUser,
  isPending,
  onRoleChange,
}: {
  user: AdminUser;
  isCurrentUser: boolean;
  isPending: boolean;
  onRoleChange: (systemRole: SystemRole) => void;
}) {
  const t = useTranslations();
  const nextRole: SystemRole = user.systemRole === 'ADMIN' ? 'USER' : 'ADMIN';
  const isSelfDemotion = isCurrentUser && user.systemRole === 'ADMIN';

  return (
    <div
      className={`grid ${USER_COLUMNS} min-h-[58px] border-b border-black/10 bg-white text-sm`}
    >
      <AdminCell className="font-medium text-[var(--primary)]">
        {user.name}
      </AdminCell>
      <AdminCell>{user.email}</AdminCell>
      <AdminCell>
        <Badge variant={user.systemRole === 'ADMIN' ? 'secondary' : 'outline'}>
          {t(`platformAdmin.systemRoles.${user.systemRole}`)}
        </Badge>
      </AdminCell>
      <AdminCell>{user._count?.memberships ?? 0}</AdminCell>
      <AdminCell>
        <Button
          type="button"
          size="sm"
          variant={user.systemRole === 'ADMIN' ? 'outline' : 'secondary'}
          disabled={isPending || isSelfDemotion}
          onClick={() => onRoleChange(nextRole)}
        >
          {user.systemRole === 'ADMIN'
            ? t('platformAdmin.removeAdmin')
            : t('platformAdmin.makeAdmin')}
        </Button>
      </AdminCell>
    </div>
  );
}
