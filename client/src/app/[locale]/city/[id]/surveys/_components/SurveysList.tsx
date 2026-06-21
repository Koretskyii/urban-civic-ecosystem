'use client';

import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Vote } from 'lucide-react';
import {
  useInfiniteCitySurveys,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  useCloseSurvey,
  usePermission,
  useRoleUiMode,
} from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { RoleModeSwitcher, DebouncedSearchInput } from '@/components';
import type { Survey, SurveyStatus, ResultsVisibility } from '@/types';
import { ManageSurveysView } from './ManageSurveysView';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SurveysListProps {
  cityId: string;
}

const STATUS_OPTIONS: Array<'all' | SurveyStatus> = ['all', 'OPEN', 'CLOSED'];

export default function SurveysList({ cityId }: SurveysListProps) {
  const t = useTranslations();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SurveyStatus>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // create form state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [newClosesAt, setNewClosesAt] = useState('');
  const [formError, setFormError] = useState('');

  // edit form state
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editClosesAt, setEditClosesAt] = useState('');
  const [editResultsVisibility, setEditResultsVisibility] =
    useState<ResultsVisibility>('AFTER_CLOSE');
  const [editError, setEditError] = useState('');

  const { can: canCreate, isLoading: isCreatePermissionLoading } =
    usePermission(PERMISSION_GROUPS.SURVEY.CREATE, { cityId });
  const { can: canManage } = usePermission(PERMISSION_GROUPS.SURVEY.MANAGE, {
    cityId,
  });
  const { can: canUpdate } = usePermission(PERMISSION_GROUPS.SURVEY.UPDATE, {
    cityId,
  });
  const { can: canDelete } = usePermission(PERMISSION_GROUPS.SURVEY.DELETE, {
    cityId,
  });

  const canUseManageMode = canCreate || canManage || canUpdate || canDelete;
  const { mode: uiMode, setMode: setUiMode } = useRoleUiMode(
    canUseManageMode,
    isCreatePermissionLoading,
  );
  const isManageMode = uiMode === 'manage';

  const listQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      includeDeleted: isManageMode ? includeDeleted : false,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }),
    [search, statusFilter, isManageMode, includeDeleted],
  );

  const surveysQuery = useInfiniteCitySurveys(cityId, listQuery);
  const surveys = useMemo(
    () => surveysQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [surveysQuery.data],
  );

  const createSurveyMutation = useCreateSurvey();
  const updateSurveyMutation = useUpdateSurvey();
  const closeSurveyMutation = useCloseSurvey();
  const deleteSurveyMutation = useDeleteSurvey();

  const loadMore = useCallback(() => {
    void surveysQuery.fetchNextPage();
  }, [surveysQuery]);

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewOptions(['', '']);
    setNewClosesAt('');
    setFormError('');
  };

  const onCreateSurvey = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const title = newTitle.trim();
    const validOptions = newOptions.map((o) => o.trim()).filter(Boolean);
    if (title.length < 3) {
      setFormError(t('surveys.errors.titleRequired'));
      return;
    }
    if (validOptions.length < 2) {
      setFormError(t('surveys.errors.optionsMin'));
      return;
    }

    try {
      await createSurveyMutation.mutateAsync({
        cityId,
        payload: {
          title,
          description: newDescription.trim() || undefined,
          options: validOptions.map((text) => ({ text })),
          closesAt: newClosesAt || undefined,
        },
      });
      resetCreateForm();
      setCreateOpen(false);
    } catch {
      setFormError(t('surveys.errors.create'));
    }
  };

  const onCloseSurvey = async (surveyId: string) => {
    try {
      await closeSurveyMutation.mutateAsync({ cityId, surveyId });
    } catch {
      // ignore — user sees stale data at worst
    }
  };

  const onDeleteSurvey = async (surveyId: string) => {
    try {
      await deleteSurveyMutation.mutateAsync({ cityId, surveyId });
    } catch {
      // ignore
    }
  };

  const startEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setEditTitle(survey.title);
    setEditDescription(survey.description ?? '');
    setEditClosesAt(
      survey.closesAt
        ? new Date(survey.closesAt).toISOString().slice(0, 16)
        : '',
    );
    setEditResultsVisibility(survey.resultsVisibility);
    setEditError('');
  };

  const onSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSurvey) return;
    setEditError('');
    const title = editTitle.trim();
    if (title.length < 3) {
      setEditError(t('surveys.errors.titleRequired'));
      return;
    }
    try {
      await updateSurveyMutation.mutateAsync({
        cityId,
        surveyId: editingSurvey.id,
        payload: {
          title,
          description: editDescription.trim() || undefined,
          closesAt: editClosesAt || null,
          resultsVisibility: editResultsVisibility,
        },
      });
      setEditingSurvey(null);
    } catch {
      setEditError(t('surveys.errors.update'));
    }
  };

  if (surveysQuery.isLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (surveysQuery.error) {
    return (
      <p className="mt-2 text-sm text-[var(--danger-dark)]">
        {t('surveys.loadError')}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-[var(--secondary)]/10 p-2 text-[var(--secondary-dark)]">
          <Vote size={20} />
        </div>
        <h2 className="text-2xl">{t('surveys.title')}</h2>
      </div>

      <div className="mb-3">
        <RoleModeSwitcher
          value={uiMode}
          canManage={canUseManageMode}
          isPermissionLoading={isCreatePermissionLoading}
          onChange={setUiMode}
        />
      </div>

      {isManageMode ? (
        <ManageSurveysView
          surveys={surveys}
          search={search}
          statusFilter={statusFilter}
          includeDeleted={includeDeleted}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canManage={canManage}
          isCreating={createSurveyMutation.isPending}
          isClosing={closeSurveyMutation.isPending}
          isDeleting={deleteSurveyMutation.isPending}
          hasNextPage={surveysQuery.hasNextPage}
          isFetchingNextPage={surveysQuery.isFetchingNextPage}
          createOpen={createOpen}
          newTitle={newTitle}
          newDescription={newDescription}
          newOptions={newOptions}
          newClosesAt={newClosesAt}
          formError={formError}
          t={t}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onIncludeDeletedChange={setIncludeDeleted}
          onCreateOpenChange={(open) => {
            if (!open) resetCreateForm();
            setCreateOpen(open);
          }}
          onNewTitleChange={setNewTitle}
          onNewDescriptionChange={setNewDescription}
          onNewOptionsChange={setNewOptions}
          onNewClosesAtChange={setNewClosesAt}
          onCreateSurvey={onCreateSurvey}
          onOpenSurvey={(id) => router.push(`/city/${cityId}/surveys/${id}`)}
          onStartEdit={startEdit}
          onCloseSurvey={onCloseSurvey}
          onDeleteSurvey={onDeleteSurvey}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <DebouncedSearchInput
              value={search}
              onValueChange={setSearch}
              placeholder={t('surveys.searchPlaceholder')}
              className="h-10 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="h-10 !w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all'
                      ? t('surveys.statusFilter.all')
                      : t(`surveys.statusFilter.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {surveys.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {t('surveys.empty')}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {surveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  isManageMode={false}
                  canManage={false}
                  canUpdate={false}
                  canDelete={false}
                  isClosing={false}
                  isDeleting={false}
                  t={t}
                  onOpen={() =>
                    router.push(`/city/${cityId}/surveys/${survey.id}`)
                  }
                  onClose={() => undefined}
                  onEdit={() => undefined}
                  onDelete={() => undefined}
                />
              ))}
            </div>
          )}

          {surveysQuery.hasNextPage ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={surveysQuery.isFetchingNextPage}
              className="mt-3 rounded-md border border-[var(--secondary)]/30 px-3 py-2 text-sm text-[var(--secondary-dark)] disabled:opacity-60"
            >
              {surveysQuery.isFetchingNextPage
                ? t('common.processing')
                : t('common.loadMore')}
            </button>
          ) : null}
        </>
      )}

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editingSurvey)}
        onOpenChange={(open) => {
          if (!open) setEditingSurvey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('surveys.editTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSaveEdit} className="flex flex-col gap-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={t('surveys.fields.title')}
              className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t('surveys.fields.description')}
              rows={2}
              className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <input
              type="datetime-local"
              value={editClosesAt}
              onChange={(e) => setEditClosesAt(e.target.value)}
              step="60"
              className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <Select
              value={editResultsVisibility}
              onValueChange={(v) =>
                setEditResultsVisibility(v as ResultsVisibility)
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ['LIVE', 'AFTER_VOTE', 'AFTER_CLOSE'] as ResultsVisibility[]
                ).map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`surveys.resultsVisibility.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editError ? (
              <p className="text-xs text-[var(--danger-dark)]">{editError}</p>
            ) : null}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditingSurvey(null)}
                className="rounded-md px-3 py-2 text-sm"
              >
                {t('surveys.actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={updateSurveyMutation.isPending}
                className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updateSurveyMutation.isPending
                  ? t('surveys.actions.saving')
                  : t('surveys.actions.save')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SurveyCardProps {
  survey: Survey;
  isManageMode: boolean;
  canManage: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isClosing: boolean;
  isDeleting: boolean;
  t: ReturnType<typeof useTranslations>;
  onOpen: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SurveyCard({
  survey,
  isManageMode,
  canManage,
  canUpdate,
  canDelete,
  isClosing,
  isDeleting,
  t,
  onOpen,
  onClose,
  onEdit,
  onDelete,
}: SurveyCardProps) {
  const isClosed = survey.status === 'CLOSED';
  const isDeleted = Boolean(survey.deletedAt);

  const formattedClosesAt = survey.closesAt
    ? new Date(survey.closesAt).toLocaleString('uk-UA')
    : null;
  const formattedClosedAt = survey.closedAt
    ? new Date(survey.closedAt).toLocaleString('uk-UA')
    : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`flex min-h-[160px] flex-col rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isDeleted ? 'opacity-60' : ''
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={isClosed ? 'outline' : 'default'}>
          {t(`surveys.status.${survey.status}`)}
        </Badge>
        {isDeleted ? (
          <Badge variant="danger">{t('surveys.deletedLabel')}</Badge>
        ) : null}
        {survey.myVote ? <Badge variant="success">✓</Badge> : null}
      </div>

      <h3 className="mb-1 flex-1 text-base font-semibold leading-snug">
        {survey.title}
      </h3>

      {survey.description ? (
        <p className="mb-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
          {survey.description}
        </p>
      ) : null}

      <p className="text-xs text-[var(--muted-foreground)]">
        {survey._count
          ? t('surveys.voteCount', { count: survey._count.votes })
          : null}
        {formattedClosedAt
          ? ` · ${t('surveys.closedAt', { date: formattedClosedAt })}`
          : formattedClosesAt
            ? ` · ${t('surveys.closesAt', { date: formattedClosesAt })}`
            : null}
      </p>

      {isManageMode ? (
        <div
          className="mt-2 flex gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="group"
        >
          {canUpdate && !isClosed && !isDeleted ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded px-2 py-1 text-xs text-[var(--secondary-dark)] hover:bg-[var(--secondary)]/10"
            >
              {t('surveys.actions.edit')}
            </button>
          ) : null}
          {canManage && !isClosed && !isDeleted ? (
            <button
              type="button"
              onClick={onClose}
              disabled={isClosing}
              className="rounded px-2 py-1 text-xs text-[var(--warning-dark)] hover:bg-[var(--warning)]/10 disabled:opacity-60"
            >
              {t('surveys.actions.close')}
            </button>
          ) : null}
          {canDelete && !isDeleted ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded px-2 py-1 text-xs text-[var(--danger-dark)] hover:bg-[var(--danger)]/10 disabled:opacity-60"
            >
              {t('surveys.actions.delete')}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
