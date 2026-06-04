'use client';

import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { usePermission } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useCreateNews,
  useDeleteNews,
  useInfiniteCityNews,
  useRoleUiMode,
  useUpdateNews,
} from '@/hooks';
import { useTranslations } from 'next-intl';
import { FormEvent, useMemo, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { RoleModeSwitcher } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { News } from '@/types';
import { CitizenNewsView } from './CitizenNewsView';
import { ManageNewsView } from './ManageNewsView';

interface NewsGridProps {
  cityId: string;
}

export default function NewsGrid(props: NewsGridProps) {
  const t = useTranslations();
  const { cityId } = props;
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>(
    'createdAt',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [formError, setFormError] = useState('');
  const debouncedSearch = useDebouncedValue(search, 450);

  const { can: canCreateNews, isLoading: isCreatePermissionLoading } =
    usePermission(PERMISSION_GROUPS.NEWS.CREATE, {
      cityId,
    });
  const { can: canUpdateNews } = usePermission(PERMISSION_GROUPS.NEWS.UPDATE, {
    cityId,
  });
  const { can: canDeleteNews } = usePermission(PERMISSION_GROUPS.NEWS.DELETE, {
    cityId,
  });
  const { can: canManageNews } = usePermission(PERMISSION_GROUPS.NEWS.MANAGE, {
    cityId,
  });
  const canUseManageMode =
    canCreateNews || canUpdateNews || canDeleteNews || canManageNews;
  const { mode: uiMode, setMode: setUiMode } = useRoleUiMode(
    canUseManageMode,
    isCreatePermissionLoading,
  );
  const isManageMode = uiMode === 'manage';

  const listQuery = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      includeDeleted: isManageMode && canManageNews ? includeDeleted : false,
      sortBy,
      sortOrder,
    }),
    [
      debouncedSearch,
      isManageMode,
      canManageNews,
      includeDeleted,
      sortBy,
      sortOrder,
    ],
  );

  const newsQuery = useInfiniteCityNews(cityId, listQuery);
  const news = useMemo(
    () => newsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [newsQuery.data],
  );
  const createNewsMutation = useCreateNews();
  const updateNewsMutation = useUpdateNews();
  const deleteNewsMutation = useDeleteNews();

  const visibleNews = useMemo(() => {
    if (isManageMode && canManageNews) return news;
    return news.filter((item: News) => !item.deletedAt);
  }, [news, isManageMode, canManageNews]);

  const onCreateNews = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const title = newTitle.trim();
    const content = newContent.trim();

    if (title.length < 3 || content.length < 3) {
      setFormError(t('news.formValidation'));
      return;
    }

    try {
      await createNewsMutation.mutateAsync({
        cityId,
        payload: { title, content },
        files: newFiles,
      });
      setNewTitle('');
      setNewContent('');
      setNewFiles([]);
    } catch {
      setFormError(t('news.createError'));
    }
  };

  const startEdit = (item: { id: string; title: string; content: string }) => {
    setEditingNewsId(item.id);
    setEditingTitle(item.title);
    setEditingContent(item.content);
    setFormError('');
  };

  const onSaveEdit = async () => {
    if (!editingNewsId) return;
    const title = editingTitle.trim();
    const content = editingContent.trim();
    if (title.length < 3 || content.length < 3) {
      setFormError(t('news.formValidation'));
      return;
    }

    try {
      await updateNewsMutation.mutateAsync({
        cityId,
        newsId: editingNewsId,
        payload: { title, content },
      });
      setEditingNewsId(null);
      setEditingTitle('');
      setEditingContent('');
    } catch {
      setFormError(t('news.updateError'));
    }
  };

  const onDeleteNews = async (newsId: string) => {
    try {
      await deleteNewsMutation.mutateAsync({ cityId, newsId });
    } catch {
      setFormError(t('news.deleteError'));
    }
  };

  const openNewsDetail = (newsId: string) => {
    router.push(`/city/${cityId}/news/${newsId}`);
  };

  if (newsQuery.isLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (newsQuery.error) {
    return (
      <p className="mt-2 text-sm text-[var(--danger-dark)]">
        {t('news.loadError')}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-[var(--secondary)]/10 p-2 text-[var(--secondary)]">
          <Newspaper size={20} />
        </div>
        <h2 className="text-2xl">{t('news.title')}</h2>
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
        <ManageNewsView
          news={visibleNews}
          search={search}
          includeDeleted={includeDeleted}
          sortBy={sortBy}
          sortOrder={sortOrder}
          formError={formError}
          newTitle={newTitle}
          newContent={newContent}
          newFiles={newFiles}
          canCreateNews={canCreateNews}
          canUpdateNews={canUpdateNews}
          canDeleteNews={canDeleteNews}
          canManageNews={canManageNews}
          isCreating={createNewsMutation.isPending}
          isDeleting={deleteNewsMutation.isPending}
          hasNextPage={newsQuery.hasNextPage}
          isFetchingNextPage={newsQuery.isFetchingNextPage}
          t={t}
          onSearchChange={setSearch}
          onIncludeDeletedChange={setIncludeDeleted}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onNewTitleChange={setNewTitle}
          onNewContentChange={setNewContent}
          onNewFilesChange={setNewFiles}
          onCreateNews={onCreateNews}
          onOpenNews={openNewsDetail}
          onStartEdit={startEdit}
          onDeleteNews={onDeleteNews}
          onLoadMore={() => newsQuery.fetchNextPage()}
        />
      ) : (
        <CitizenNewsView
          news={visibleNews}
          search={search}
          isFetchingNextPage={newsQuery.isFetchingNextPage}
          hasNextPage={newsQuery.hasNextPage}
          t={t}
          onSearchChange={setSearch}
          onOpenNews={openNewsDetail}
          onLoadMore={() => newsQuery.fetchNextPage()}
        />
      )}

      <Dialog
        open={Boolean(editingNewsId)}
        onOpenChange={(open) => {
          if (!open) setEditingNewsId(null);
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('news.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <input
              placeholder={t('news.fields.title')}
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              required
              className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <textarea
              placeholder={t('news.fields.content')}
              value={editingContent}
              onChange={(event) => setEditingContent(event.target.value)}
              required
              rows={5}
              className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)]"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingNewsId(null)}
              className="rounded-md px-3 py-2 text-sm"
            >
              {t('news.actions.cancel')}
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={updateNewsMutation.isPending}
              className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {updateNewsMutation.isPending
                ? t('news.actions.saving')
                : t('news.actions.save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
