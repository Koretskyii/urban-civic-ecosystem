'use client';

import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { usePermission } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useCityNews,
  useCreateNews,
  useDeleteNews,
  useUpdateNews,
} from '@/hooks';
import { useTranslations } from 'next-intl';
import { FormEvent, useMemo, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/ui/file-upload';
import { FilePreviewList } from '@/components/ui/file-preview-list';
import type { Attachment, News } from '@/types';

interface NewsGridProps {
  cityId: string;
}

export default function NewsGrid(props: NewsGridProps) {
  const t = useTranslations();
  const { cityId } = props;
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [formError, setFormError] = useState('');
  const debouncedSearch = useDebouncedValue(search, 450);

  const { can: canCreateNews } = usePermission(PERMISSION_GROUPS.NEWS.CREATE, {
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

  const listQuery = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      includeDeleted: canManageNews ? includeDeleted : false,
    }),
    [debouncedSearch, canManageNews, includeDeleted],
  );

  const { data: news, isLoading, error } = useCityNews(cityId, listQuery);
  const createNewsMutation = useCreateNews();
  const updateNewsMutation = useUpdateNews();
  const deleteNewsMutation = useDeleteNews();

  const canManageView = canCreateNews || canUpdateNews || canDeleteNews;
  const visibleNews = useMemo(() => {
    if (!news) return [];
    if (canManageNews) return news;
    return news.filter((item: News) => !item.deletedAt);
  }, [news, canManageNews]);

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

  if (isLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (error) {
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

      {canManageView ? (
        <div className="mb-3">
          {formError ? (
            <p className="mb-2 rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
              {formError}
            </p>
          ) : null}
          {canCreateNews ? (
            <form
              onSubmit={onCreateNews}
              className="grid gap-2 rounded-xl border border-[var(--secondary)]/20 bg-[linear-gradient(180deg,rgba(63,136,197,0.04)_0%,#fff_46%)] p-3 shadow-sm"
            >
              <p className="text-lg font-semibold">{t('news.createTitle')}</p>
              <input
                placeholder={t('news.fields.title')}
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                required
                className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
              />
              <textarea
                placeholder={t('news.fields.content')}
                value={newContent}
                onChange={(event) => setNewContent(event.target.value)}
                required
                rows={4}
                className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
              />
              <FileUpload
                value={newFiles}
                onChange={setNewFiles}
                maxFiles={5}
                disabled={createNewsMutation.isPending}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createNewsMutation.isPending}
                  className="rounded-md bg-[linear-gradient(90deg,var(--secondary-dark)_0%,var(--primary)_100%)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                >
                  {createNewsMutation.isPending
                    ? t('news.actions.creating')
                    : t('news.actions.create')}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
            <input
              placeholder={t('news.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
            />
            {canManageNews ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={includeDeleted}
                  onCheckedChange={(checked) =>
                    setIncludeDeleted(Boolean(checked))
                  }
                />
                {t('news.includeDeleted')}
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      {visibleNews.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t('news.empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleNews.map((n: News) => {
            const date = new Date(n.createdAt);
            const formattedDate = date.toLocaleDateString('uk-UA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const formattedTime = date.toLocaleTimeString('uk-UA', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <article
                key={n.id}
                className="flex h-full flex-col rounded-xl border border-black/10 border-t-4 border-t-[var(--secondary)] bg-[linear-gradient(180deg,rgba(63,136,197,0.05)_0%,#fff_36%)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(63,136,197,0.18)]"
              >
                <p className="mb-1 text-xs text-[var(--muted-foreground)]">
                  {formattedDate} {t('common.timeSeparator')} {formattedTime}
                </p>
                <h3 className="mb-2 text-lg font-semibold">{n.title}</h3>
                <p className="mb-2 flex-1 text-sm text-[var(--muted-foreground)]">
                  {n.content}
                </p>
                {n.attachments && n.attachments.length > 0 ? (
                  <div className="mb-2">
                    <FilePreviewList
                      attachments={n.attachments as Attachment[]}
                    />
                  </div>
                ) : null}
                <div className="my-1 h-px bg-black/10" />
                <p className="text-xs font-medium text-[var(--primary-light)]">
                  {n.deletedAt
                    ? t('news.deletedLabel')
                    : t('news.officialSource')}
                </p>
                {(canUpdateNews || canDeleteNews) && !n.deletedAt ? (
                  <div className="mt-2 flex justify-end gap-2">
                    {canUpdateNews ? (
                      <button
                        type="button"
                        onClick={() =>
                          startEdit({
                            id: n.id,
                            title: n.title,
                            content: n.content,
                          })
                        }
                        className="rounded-md border border-[var(--secondary)]/40 px-2 py-1 text-xs text-[var(--secondary-dark)] hover:bg-[var(--secondary)]/10"
                      >
                        {t('news.actions.edit')}
                      </button>
                    ) : null}
                    {canDeleteNews ? (
                      <button
                        type="button"
                        onClick={() => onDeleteNews(n.id)}
                        disabled={deleteNewsMutation.isPending}
                        className="rounded-md border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)] disabled:opacity-60"
                      >
                        {t('news.actions.delete')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {editingNewsId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-2xl">
            <h3 className="mb-3 text-lg font-semibold">
              {t('news.editTitle')}
            </h3>
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
            <div className="mt-3 flex justify-end gap-2">
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
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
