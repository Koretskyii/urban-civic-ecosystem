import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminCities,
  useDeleteAdminCity,
  useUpdateAdminCity,
} from '@/hooks';
import type { AdminCity } from '@/types';
import { AdminCell, AdminTable } from '../../AdminTable/AdminTable';
import { AdminToolbar } from '../../AdminToolbar/AdminToolbar';
import { PaginationControls } from '../../PaginationControls/PaginationControls';
import { TableState } from '../../TableState/TableState';

const ADMIN_PAGE_SIZE = 25;
const CITY_COLUMNS = 'grid-cols-[18%_18%_22%_10%_12%_20%]';

export function CitiesSection() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminCity>>>({});
  const query = useAdminCities({
    search,
    includeDeleted,
    page,
    limit: ADMIN_PAGE_SIZE,
  });
  const updateCity = useUpdateAdminCity();
  const deleteCity = useDeleteAdminCity();
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <section className="space-y-3">
      <AdminToolbar title={t('platformAdmin.cities.title')} total={total}>
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder={t('platformAdmin.search')}
          className="h-10 md:w-64"
        />
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(event) => {
              setIncludeDeleted(event.target.checked);
              setPage(1);
            }}
          />
          {t('platformAdmin.includeDeleted')}
        </label>
      </AdminToolbar>

      <TableState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={items.length === 0}
      />

      {items.length > 0 ? (
        <>
          <AdminTable
            minWidth="1120px"
            columns={CITY_COLUMNS}
            headers={[
              t('platformAdmin.city'),
              t('platformAdmin.region'),
              t('platformAdmin.domain'),
              t('platformAdmin.members'),
              t('platformAdmin.status'),
              t('platformAdmin.actions'),
            ]}
          >
            {items.map((city) => {
              const draft = drafts[city.id] ?? {};
              const nextName = String(draft.name ?? city.name);
              const nextRegion = String(draft.region ?? city.region);
              const nextDomain = String(
                draft.cityDomain?.domainName ??
                  city.cityDomain?.domainName ??
                  '',
              );
              const changed =
                nextName !== city.name ||
                nextRegion !== city.region ||
                nextDomain !== (city.cityDomain?.domainName ?? '');

              return (
                <div
                  key={city.id}
                  className={`grid ${CITY_COLUMNS} min-h-[66px] border-b border-black/10 bg-white text-sm`}
                >
                  <AdminCell>
                    <Input
                      value={nextName}
                      disabled={Boolean(city.deletedAt)}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [city.id]: {
                            ...prev[city.id],
                            name: event.target.value,
                          },
                        }))
                      }
                      className="h-9"
                    />
                  </AdminCell>
                  <AdminCell>
                    <Input
                      value={nextRegion}
                      disabled={Boolean(city.deletedAt)}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [city.id]: {
                            ...prev[city.id],
                            region: event.target.value,
                          },
                        }))
                      }
                      className="h-9"
                    />
                  </AdminCell>
                  <AdminCell>
                    <Input
                      value={nextDomain}
                      disabled={Boolean(city.deletedAt)}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [city.id]: {
                            ...prev[city.id],
                            cityDomain: { domainName: event.target.value },
                          },
                        }))
                      }
                      className="h-9"
                    />
                  </AdminCell>
                  <AdminCell>{city._count?.users ?? 0}</AdminCell>
                  <AdminCell>
                    {city.deletedAt ? (
                      <Badge variant="danger">
                        {t('platformAdmin.deleted')}
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        {t('platformAdmin.active')}
                      </Badge>
                    )}
                  </AdminCell>
                  <AdminCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!changed || updateCity.isPending}
                        onClick={() =>
                          updateCity.mutate({
                            id: city.id,
                            data: {
                              name: nextName,
                              region: nextRegion,
                              domain: nextDomain,
                            },
                          })
                        }
                      >
                        {t('platformAdmin.save')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={
                          Boolean(city.deletedAt) || deleteCity.isPending
                        }
                        onClick={() => deleteCity.mutate(city.id)}
                      >
                        {t('platformAdmin.delete')}
                      </Button>
                    </div>
                  </AdminCell>
                </div>
              );
            })}
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
