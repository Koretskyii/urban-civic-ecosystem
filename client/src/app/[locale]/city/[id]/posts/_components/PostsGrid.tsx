'use client';

import { useCityPosts } from '@/hooks/useCities';
import { useTranslations } from 'next-intl';
import { FileText, UserRound } from 'lucide-react';

interface PostsGridProps {
  cityId: string;
}

export default function PostsGrid(props: PostsGridProps) {
  const t = useTranslations();
  const { cityId } = props;
  const { data: posts, isLoading, error } = useCityPosts(cityId);

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
        {t('posts.loadError')}
      </p>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {t('posts.empty')}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-[var(--success)]/10 p-2 text-[var(--success)]">
          <FileText size={20} />
        </div>
        <h2 className="text-2xl">{t('posts.title')}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => {
          const date = new Date(post.createdAt);
          const formattedDate = date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          const formattedTime = date.toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const authorName = post.author
            ? post.author.name
            : t('common.unknownUser');

          return (
            <article
              key={post.id}
              className="flex h-full flex-col rounded-xl border border-black/10 border-t-4 border-t-[var(--success)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(49,107,80,0.16)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--success-light)] text-xs text-white">
                  <UserRound size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-4">
                    {authorName}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formattedDate} {t('common.timeSeparator')} {formattedTime}
                  </p>
                </div>
              </div>

              <p className="flex-1 whitespace-pre-wrap text-sm">
                {post.content}
              </p>

              <div className="my-2 h-px bg-black/10" />
              <p className="text-xs font-medium text-[var(--success)]">
                {t('posts.residentPost')}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
