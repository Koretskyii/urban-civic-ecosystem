'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowLeft, Vote } from 'lucide-react';
import {
  useSurveyDetail,
  useCastVote,
  useRetractVote,
  useCloseSurvey,
  useDeleteSurvey,
  useUpdateSurvey,
  usePermission,
} from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Survey, SurveyVoteResult, ResultsVisibility } from '@/types';

interface SurveyDetailViewProps {
  cityId: string;
  surveyId: string;
}

export default function SurveyDetailView({ cityId, surveyId }: SurveyDetailViewProps) {
  const t = useTranslations();
  const router = useRouter();

  const { data: survey, isLoading, isError } = useSurveyDetail(cityId, surveyId);

  const { can: canManage } = usePermission(PERMISSION_GROUPS.SURVEY.MANAGE, { cityId });
  const { can: canUpdate } = usePermission(PERMISSION_GROUPS.SURVEY.UPDATE, { cityId });
  const { can: canDelete } = usePermission(PERMISSION_GROUPS.SURVEY.DELETE, { cityId });
  const { can: canVote } = usePermission(PERMISSION_GROUPS.VOTE.CREATE, { cityId });
  const { can: canRetract } = usePermission(PERMISSION_GROUPS.VOTE.DELETE, { cityId });

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState('');

  // edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editClosesAt, setEditClosesAt] = useState('');
  const [editResultsVisibility, setEditResultsVisibility] = useState<ResultsVisibility>('AFTER_CLOSE');
  const [editError, setEditError] = useState('');

  const castVoteMutation = useCastVote();
  const retractVoteMutation = useRetractVote();
  const closeSurveyMutation = useCloseSurvey();
  const deleteSurveyMutation = useDeleteSurvey();
  const updateSurveyMutation = useUpdateSurvey();

  if (isLoading) {
    return (
      <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (isError || !survey) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/city/${cityId}/surveys`)}
        >
          <ArrowLeft size={16} className="mr-2" />
          {t('surveys.detail.backToSurveys')}
        </Button>
        <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-4 text-sm text-[var(--danger-dark)]">
          {t('surveys.loadError')}
        </p>
      </div>
    );
  }

  const isClosed = survey.status === 'CLOSED';
  const isDeleted = Boolean(survey.deletedAt);
  const now = new Date();
  const isExpired = Boolean(survey.closesAt && new Date(survey.closesAt) <= now);
  const canActuallyVote =
    canVote && !isClosed && !isExpired && !isDeleted && survey.allowVoteChange
      ? true
      : canVote && !isClosed && !isExpired && !isDeleted && !survey.myVote;
  const effectiveOption = selectedOptionId ?? survey.myVote ?? null;

  const onVote = async () => {
    if (!effectiveOption) return;
    setVoteError('');
    try {
      await castVoteMutation.mutateAsync({
        cityId,
        surveyId,
        payload: { optionId: effectiveOption },
      });
      setSelectedOptionId(null);
    } catch {
      setVoteError(t('surveys.errors.vote'));
    }
  };

  const onRetract = async () => {
    setVoteError('');
    try {
      await retractVoteMutation.mutateAsync({ cityId, surveyId });
    } catch {
      setVoteError(t('surveys.errors.retract'));
    }
  };

  const onClose = async () => {
    try {
      await closeSurveyMutation.mutateAsync({ cityId, surveyId });
    } catch {
      // ignore
    }
  };

  const onDelete = async () => {
    try {
      await deleteSurveyMutation.mutateAsync({ cityId, surveyId });
      router.push(`/city/${cityId}/surveys`);
    } catch {
      // ignore
    }
  };

  const openEdit = () => {
    setEditTitle(survey.title);
    setEditDescription(survey.description ?? '');
    setEditClosesAt(
      survey.closesAt ? new Date(survey.closesAt).toISOString().slice(0, 16) : '',
    );
    setEditResultsVisibility(survey.resultsVisibility);
    setEditError('');
    setEditOpen(true);
  };

  const onSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    setEditError('');
    const title = editTitle.trim();
    if (title.length < 3) {
      setEditError(t('surveys.errors.titleRequired'));
      return;
    }
    try {
      await updateSurveyMutation.mutateAsync({
        cityId,
        surveyId,
        payload: {
          title,
          description: editDescription.trim() || undefined,
          closesAt: editClosesAt || null,
          resultsVisibility: editResultsVisibility,
        },
      });
      setEditOpen(false);
    } catch {
      setEditError(t('surveys.errors.update'));
    }
  };

  const canSeeResults =
    canManage ||
    survey.resultsVisibility === 'LIVE' ||
    (survey.resultsVisibility === 'AFTER_VOTE' && (Boolean(survey.myVote) || isClosed)) ||
    (survey.resultsVisibility === 'AFTER_CLOSE' && isClosed);

  const showResults = canSeeResults && Boolean(survey.results);

  const totalVotes = showResults && survey.results
    ? survey.results.reduce((acc, r) => acc + r.count, 0)
    : 0;

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push(`/city/${cityId}/surveys`)}
      >
        <ArrowLeft size={16} className="mr-2" />
        {t('surveys.detail.backToSurveys')}
      </Button>

      <article className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b bg-[var(--secondary)]/5 p-5 md:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={isClosed ? 'outline' : 'default'}>
              {t(`surveys.status.${survey.status}`)}
            </Badge>
            {isDeleted ? (
              <Badge variant="danger">{t('surveys.deletedLabel')}</Badge>
            ) : null}
            {survey.myVote ? (
              <Badge variant="success">✓ {t('surveys.actions.vote')}</Badge>
            ) : null}
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/70 p-2 text-[var(--secondary-dark)]">
              <Vote size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl leading-tight text-[var(--primary)] md:text-3xl">
                {survey.title}
              </h1>
              {survey.description ? (
                <p className="mt-1 text-sm text-[var(--primary-light)]">
                  {survey.description}
                </p>
              ) : null}
            </div>
          </div>

          {/* Manage actions */}
          <div className="mt-3 flex gap-2">
            {canUpdate && !isClosed && !isDeleted ? (
              <Button
                type="button"
                variant="outline"
                onClick={openEdit}
              >
                {t('surveys.actions.edit')}
              </Button>
            ) : null}
            {canManage && !isClosed && !isDeleted ? (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={closeSurveyMutation.isPending}
              >
                {closeSurveyMutation.isPending
                  ? t('surveys.actions.closing')
                  : t('surveys.actions.close')}
              </Button>
            ) : null}
            {canDelete && !isDeleted ? (
              <Button
                type="button"
                variant="danger"
                onClick={onDelete}
                disabled={deleteSurveyMutation.isPending}
              >
                {t('surveys.actions.delete')}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-4 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Vote panel */}
          <div>
            {survey.options && survey.options.length > 0 ? (
              <div className="space-y-2">
                {survey.options.map((option) => {
                  const result = survey.results?.find(
                    (r: SurveyVoteResult) => r.optionId === option.id,
                  );
                  const isMyCurrentVote = survey.myVote === option.id;
                  const isSelected = effectiveOption === option.id;

                  return (
                    <OptionRow
                      key={option.id}
                      text={option.text}
                      result={result}
                      showResults={showResults}
                      isMyVote={isMyCurrentVote}
                      isSelected={isSelected}
                      canSelect={Boolean(canActuallyVote)}
                      onSelect={() => setSelectedOptionId(option.id)}
                    />
                  );
                })}
              </div>
            ) : null}

            {/* Vote actions */}
            {canVote && !isClosed && !isExpired && !isDeleted ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedOptionId || (!survey.myVote && effectiveOption) ? (
                  <Button
                    type="button"
                    onClick={onVote}
                    disabled={castVoteMutation.isPending || !effectiveOption}
                  >
                    {castVoteMutation.isPending
                      ? t('surveys.actions.voting')
                      : t('surveys.actions.vote')}
                  </Button>
                ) : null}
                {survey.myVote && canRetract && survey.allowVoteChange ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onRetract}
                    disabled={retractVoteMutation.isPending}
                  >
                    {t('surveys.actions.retract')}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {voteError ? (
              <p className="mt-2 text-sm text-[var(--danger-dark)]">{voteError}</p>
            ) : null}

            {!showResults && !isClosed ? (
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                {t('surveys.noResults')}
              </p>
            ) : null}
          </div>

          {/* Summary card */}
          <Card className="h-fit rounded-xl">
            <CardHeader>
              <CardTitle>{t('surveys.detail.resultsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">
                  {t('surveys.detail.votesTotal')}
                </span>
                <span className="font-semibold">{totalVotes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">
                  {t('surveys.fields.resultsVisibility')}
                </span>
                <span>{t(`surveys.resultsVisibility.${survey.resultsVisibility}`)}</span>
              </div>
              {survey.closesAt ? (
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    {isClosed ? t('surveys.closedAt', { date: '' }).split(':')[0] : t('surveys.closesAt', { date: '' }).split(':')[0]}
                  </span>
                  <span>
                    {new Date(
                      survey.closedAt ?? survey.closesAt,
                    ).toLocaleString('uk-UA')}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </article>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
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
              onValueChange={(v) => setEditResultsVisibility(v as ResultsVisibility)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['LIVE', 'AFTER_VOTE', 'AFTER_CLOSE'] as ResultsVisibility[]).map((v) => (
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
                onClick={() => setEditOpen(false)}
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

interface OptionRowProps {
  text: string;
  result?: SurveyVoteResult;
  showResults: boolean;
  isMyVote: boolean;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: () => void;
}

function OptionRow({
  text,
  result,
  showResults,
  isMyVote,
  isSelected,
  canSelect,
  onSelect,
}: OptionRowProps) {
  const percent = result?.percent ?? 0;

  return (
    <div
      role={canSelect ? 'button' : undefined}
      tabIndex={canSelect ? 0 : undefined}
      onClick={canSelect ? onSelect : undefined}
      onKeyDown={
        canSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-lg border px-4 py-3 transition ${
        isSelected
          ? 'border-[var(--secondary)] bg-[var(--secondary)]/8'
          : isMyVote
            ? 'border-[var(--success)]/50 bg-[var(--success)]/5'
            : canSelect
              ? 'cursor-pointer border-black/10 hover:border-[var(--secondary)]/50 hover:bg-[var(--secondary)]/5'
              : 'border-black/10'
      }`}
    >
      {showResults && percent > 0 ? (
        <div
          className="absolute inset-y-0 left-0 bg-[var(--secondary)]/10"
          style={{ width: `${percent}%` }}
        />
      ) : null}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isMyVote ? (
            <span className="text-[var(--success)]">✓</span>
          ) : isSelected ? (
            <span className="text-[var(--secondary-dark)]">●</span>
          ) : (
            <span className="text-[var(--muted-foreground)]">○</span>
          )}
          <span className="text-sm">{text}</span>
        </div>
        {showResults ? (
          <span className="shrink-0 text-xs font-semibold text-[var(--secondary-dark)]">
            {percent}%{result ? ` (${result.count})` : ''}
          </span>
        ) : null}
      </div>
    </div>
  );
}
