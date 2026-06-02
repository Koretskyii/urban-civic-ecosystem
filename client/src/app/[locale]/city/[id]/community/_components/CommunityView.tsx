'use client';

import { useCityCommunity } from '@/hooks/useCities';
import { useTranslations } from 'next-intl';
import { Users, UserRound, MessageCircle, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CommunityViewProps {
  cityId: string;
}

export default function CommunityView(props: CommunityViewProps) {
  const t = useTranslations();
  const { cityId } = props;
  const { data: community, isLoading, error } = useCityCommunity(cityId);

  if (isLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (error || !community) {
    return (
      <p className="mt-2 text-sm text-[var(--danger-dark)]">
        {t('community.loadError')}
      </p>
    );
  }

  const posts = community.posts || [];
  const chat = community.chats?.[0];
  const messages = chat?.messages || [];

  return (
    <div className="mt-2 pb-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-[var(--primary)]/10 p-2 text-[var(--primary)]">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-2xl">{community.name}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {community.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="mb-4 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold">
                {t('community.membersTitle')}
              </p>
              <div className="flex -space-x-2">
                {['О', 'М', 'І', 'А', 'П', 'Д'].map((initial) => (
                  <div
                    key={initial}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--success-light)] text-xs font-semibold text-white"
                  >
                    {initial}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="mb-3 text-xl">{t('community.latestPostsTitle')}</h3>
          <div className="space-y-3">
            {posts.map((post) => {
              const date = new Date(post.createdAt);
              const formattedDate = date.toLocaleDateString('uk-UA', {
                day: 'numeric',
                month: 'long',
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
                  className="rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success-light)] text-xs text-white">
                      <UserRound size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{authorName}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formattedDate} {t('common.timeSeparator')}{' '}
                        {formattedTime}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                </article>
              );
            })}
            {posts.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t('community.noPosts')}
              </p>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-6 flex h-[600px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-black/10 p-3">
              <MessageCircle
                size={18}
                className="text-[var(--primary-light)]"
              />
              <p className="font-semibold">{t('community.chatTitle')}</p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-black/[0.01] p-3">
              {messages.map((msg) => {
                const time = new Date(msg.timestamp).toLocaleTimeString(
                  'uk-UA',
                  { hour: '2-digit', minute: '2-digit' },
                );
                const authorName = msg.author
                  ? msg.author.name
                  : t('common.guest');
                return (
                  <div key={msg.id} className="space-y-0.5">
                    <p className="ml-1 text-xs text-[var(--muted-foreground)]">
                      {authorName} • {time}
                    </p>
                    <div className="max-w-[90%] rounded-lg border border-black/10 bg-white p-2 text-sm">
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 ? (
                <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
                  {t('community.noMessages')}
                </p>
              ) : null}
            </div>

            <div className="border-t border-black/10 p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('community.messagePlaceholder')}
                  className="h-9"
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 bg-[var(--primary-light)] hover:bg-[var(--primary)]"
                >
                  <SendHorizontal size={15} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
