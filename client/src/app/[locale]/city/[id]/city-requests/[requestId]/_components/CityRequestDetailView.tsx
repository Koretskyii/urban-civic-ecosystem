'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, CalendarDays, MessageSquare } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { RoleModeSwitcher } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermission, useRoleUiMode } from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { CITY_REQUEST_STATUS_BADGE_VARIANT } from '@/features/city-requests';
import { ProblemLocationPicker } from '../../_components/Map/ProblemLocationPicker';
import { MunicipalityRequestControls } from '../../_components/RequestDetailPanel/MunicipalityRequestControls/MunicipalityRequestControls';
import { RequestAttachmentsSection } from '../../_components/RequestDetailPanel/RequestAttachmentsSection/RequestAttachmentsSection';
import { RequestChatSection } from '../../_components/RequestDetailPanel/RequestChatSection/RequestChatSection';
import { RequestTimelineSection } from '../../_components/RequestDetailPanel/RequestTimelineSection/RequestTimelineSection';
import { useCityRequestDetailController } from '../../_components/useCityRequestDetailController';

interface CityRequestDetailViewProps {
  cityId: string;
  requestId: string;
}

export default function CityRequestDetailView({
  cityId,
  requestId,
}: CityRequestDetailViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { can: canManageRequests, isLoading: isPermissionLoading } =
    usePermission(PERMISSION_GROUPS.CITY_REQUEST.MANAGE, { cityId });
  const { mode: uiMode, setMode: setUiMode } = useRoleUiMode(
    canManageRequests,
    isPermissionLoading,
  );
  const viewMode: 'citizen' | 'municipality' =
    uiMode === 'manage' ? 'municipality' : 'citizen';
  const controller = useCityRequestDetailController({
    cityId,
    requestId,
    canManageRequests,
    viewMode,
  });
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  );

  const { detail } = controller;

  if (controller.detailQuery.isLoading) {
    return (
      <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
        {t('cityProblem.loading')}
      </div>
    );
  }

  if (controller.detailQuery.isError || !detail) {
    return (
      <div className="space-y-3">
        <BackButton cityId={cityId} />
        <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-4 text-sm text-[var(--danger-dark)]">
          {t('cityProblem.loadError')}
        </p>
      </div>
    );
  }

  const timelineSection = (
    <RequestTimelineSection
      reports={detail.reports}
      title={t('cityProblem.timelineTitle')}
      emptyLabel={t('cityProblem.timelineEmpty')}
      noDescriptionLabel={t('cityProblem.timelineNoDescription')}
    />
  );

  const chatSection = (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={18} />
          {t('cityProblem.chatTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <RequestChatSection
          title={t('cityProblem.chatTitle')}
          messages={controller.messages}
          messageValue={controller.chat.message}
          onMessageChange={controller.chat.setMessage}
          onSendMessage={controller.chat.onSendMessage}
          isSendingMessage={controller.chat.isSendingMessage}
          isMessageError={controller.chat.isMessageError}
          messageFailedLabel={t('cityProblem.errors.messageFailed')}
          messagePlaceholder={t('cityProblem.fields.message')}
          sendLabel={t('cityProblem.actions.send')}
          showTitle={false}
        />
      </CardContent>
    </Card>
  );

  const mapSection = (
    <Card className="flex h-full flex-col">
      <CardContent className="flex-1 pt-4">
        <ProblemLocationPicker
          lat={String(detail.locationLat ?? '')}
          lng={String(detail.locationLng ?? '')}
          readOnly
          titleKey="cityProblem.map.previewTitle"
          hintKey="cityProblem.map.previewHint"
        />
      </CardContent>
    </Card>
  );

  const attachmentsSection = (
    <RequestAttachmentsSection
      attachments={detail.attachments}
      title={t('cityProblem.attachmentsTitle')}
      emptyLabel={t('cityProblem.attachmentsEmpty')}
      className="h-full"
    />
  );

  const controlsSection =
    viewMode === 'municipality' && canManageRequests ? (
      <MunicipalityRequestControls
        title={t('cityProblem.municipality.controlsTitle')}
        error={controller.controls.municipalityError}
        departmentLabel={t('cityProblem.fields.department')}
        assignLabel={t('cityProblem.actions.assign')}
        updateStatusLabel={t('cityProblem.actions.updateStatus')}
        createReportLabel={t('cityProblem.actions.createReport')}
        useReportForFinalStatusLabel={t(
          'cityProblem.errors.useReportForFinalStatus',
        )}
        reportTextLabel={t('cityProblem.fields.reportText')}
        reportTextRequiredHint={t(
          'cityProblem.municipality.reportTextRequiredHint',
        )}
        departments={controller.departments}
        selectedDepartmentId={controller.controls.selectedDepartmentId}
        onSelectedDepartmentIdChange={
          controller.controls.setSelectedDepartmentId
        }
        onAssignDepartment={controller.controls.onAssignDepartment}
        assignDisabled={controller.controls.assignDisabled}
        nextStatus={controller.controls.nextStatus}
        onNextStatusChange={controller.controls.setNextStatus}
        onUpdateStatus={controller.controls.onUpdateStatus}
        statusUpdateDisabled={controller.controls.statusUpdateDisabled}
        reportType={controller.controls.reportType}
        onReportTypeChange={controller.controls.setReportType}
        reportText={controller.controls.reportText}
        onReportTextChange={controller.controls.setReportText}
        reportFiles={controller.controls.reportFiles}
        onReportFilesChange={controller.controls.setReportFiles}
        onCreateReport={controller.controls.onCreateReport}
        isCreatingReport={controller.controls.isCreatingReport}
        isFinalStatus={controller.controls.isFinalStatus}
        isReportTextRequired={controller.controls.isReportTextRequired}
        isReportTextEmpty={controller.controls.isReportTextEmpty}
        createReportDisabled={controller.controls.createReportDisabled}
        hasFinalReport={controller.controls.hasFinalReport}
        canCreateProgressReport={controller.controls.canCreateProgressReport}
        canCreateFinalReport={controller.controls.canCreateFinalReport}
        translateStatus={(status) => t(`cityProblem.statuses.${status}`)}
        translateReportType={(type) => t(`cityProblem.reportTypes.${type}`)}
      />
    ) : null;

  return (
    <div className="space-y-4">
      <BackButton cityId={cityId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleModeSwitcher
          value={uiMode}
          canManage={canManageRequests}
          isPermissionLoading={isPermissionLoading}
          citizenLabel={t('cityProblem.viewModes.citizen')}
          manageLabel={t('cityProblem.viewModes.municipality')}
          onChange={setUiMode}
        />
      </div>

      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={CITY_REQUEST_STATUS_BADGE_VARIANT[detail.status]}>
            {t(`cityProblem.statuses.${detail.status}`)}
          </Badge>
          <Badge variant="outline">{`P${detail.priority}`}</Badge>
          {detail.assignedDepartment?.name ? (
            <Badge variant="secondary">{detail.assignedDepartment.name}</Badge>
          ) : null}
          <Badge variant="outline">
            <CalendarDays size={12} className="mr-1" />
            {dateFormatter.format(new Date(detail.createdAt))}
          </Badge>
        </div>

        <div className="mt-4 max-w-5xl">
          <h1 className="text-3xl leading-tight text-[var(--primary)] md:text-4xl">
            {detail.title}
          </h1>
          <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[var(--primary-light)]">
            {detail.description || t('cityProblem.noDescription')}
          </p>
        </div>
      </section>

      {viewMode === 'municipality' ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <aside className="space-y-4">{mapSection}</aside>
            <aside className="space-y-4">{controlsSection}</aside>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <aside className="h-full space-y-4">{attachmentsSection}</aside>
            <main className="h-full min-w-0 space-y-4">{chatSection}</main>
          </div>
          <div className="min-w-0">{timelineSection}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <main className="min-w-0 space-y-4">
            {timelineSection}
            {chatSection}
          </main>
          <div className="grid gap-4 xl:grid-cols-2">
            <aside className="h-full space-y-4">{mapSection}</aside>
            <aside className="h-full space-y-4">{attachmentsSection}</aside>
          </div>
        </div>
      )}
    </div>
  );
}

function BackButton({ cityId }: { cityId: string }) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => router.push(`/city/${cityId}/city-requests`)}
    >
      <ArrowLeft size={16} className="mr-2" />
      {t('cityProblem.actions.backToRequests')}
    </Button>
  );
}
