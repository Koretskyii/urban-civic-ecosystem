'use client';

import { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import type {
  CityRequestDetail,
  CityRequestMessage,
  CityRequestStatus,
  Department,
  ReportType,
} from '@/types';
import {
  EDITABLE_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from './problem-workspace.constants';

interface RequestDetailPanelProps {
  cityId: string;
  viewMode: 'citizen' | 'municipality';
  canManageRequests: boolean;
  activeRequestId: string;
  isLoading: boolean;
  detail?: CityRequestDetail;
  messages: CityRequestMessage[];
  messageValue: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSendingMessage: boolean;
  isMessageError: boolean;
  departments: Department[];
  selectedDepartmentId: string;
  onSelectedDepartmentIdChange: (value: string) => void;
  onAssignDepartment: () => Promise<void>;
  isAssigning: boolean;
  nextStatus: CityRequestStatus;
  onNextStatusChange: (value: CityRequestStatus) => void;
  onUpdateStatus: () => Promise<void>;
  isUpdatingStatus: boolean;
  reportType: ReportType;
  onReportTypeChange: (value: ReportType) => void;
  reportText: string;
  onReportTextChange: (value: string) => void;
  onCreateReport: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isCreatingReport: boolean;
  municipalityError: string;
}

export function RequestDetailPanel(props: RequestDetailPanelProps) {
  const t = useTranslations();
  const {
    viewMode,
    canManageRequests,
    activeRequestId,
    isLoading,
    detail,
    messages,
    messageValue,
    onMessageChange,
    onSendMessage,
    isSendingMessage,
    isMessageError,
    departments,
    selectedDepartmentId,
    onSelectedDepartmentIdChange,
    onAssignDepartment,
    isAssigning,
    nextStatus,
    onNextStatusChange,
    onUpdateStatus,
    isUpdatingStatus,
    reportType,
    onReportTypeChange,
    reportText,
    onReportTextChange,
    onCreateReport,
    isCreatingReport,
    municipalityError,
  } = props;

  return (
    <Paper sx={{ p: 2, flex: 2, minHeight: 420 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('cityProblem.detailTitle')}
      </Typography>

      {!activeRequestId ? (
        <Typography>{t('cityProblem.selectPrompt')}</Typography>
      ) : isLoading ? (
        <Typography>{t('cityProblem.loading')}</Typography>
      ) : detail ? (
        <Stack spacing={2}>
          <Typography variant="h5">{detail.title}</Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={detail.status} color="primary" size="small" />
            {detail.assignedDepartment?.name ? (
              <Chip
                label={detail.assignedDepartment.name}
                size="small"
                color="secondary"
              />
            ) : null}
          </Stack>
          <Typography color="text.secondary">
            {detail.description || t('cityProblem.noDescription')}
          </Typography>

          <Divider />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('cityProblem.timelineTitle')}
            </Typography>
            {detail.reports.length === 0 ? (
              <Typography color="text.secondary">
                {t('cityProblem.timelineEmpty')}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {detail.reports.map((report) => (
                  <Box key={report.id}>
                    <Typography variant="subtitle2">
                      {report.type}
                      {report.status ? ` - ${report.status}` : ''}
                    </Typography>
                    <Typography variant="body2">
                      {report.description ||
                        t('cityProblem.timelineNoDescription')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {report.author.name}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          <Divider />

          {viewMode === 'municipality' && canManageRequests ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6">
                  {t('cityProblem.municipality.controlsTitle')}
                </Typography>

                {municipalityError ? (
                  <Alert severity="warning">{municipalityError}</Alert>
                ) : null}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <TextField
                    select
                    fullWidth
                    label={t('cityProblem.fields.department')}
                    value={selectedDepartmentId}
                    onChange={(event) =>
                      onSelectedDepartmentIdChange(event.target.value)
                    }
                  >
                    {departments.map((department) => (
                      <MenuItem key={department.id} value={department.id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    onClick={onAssignDepartment}
                    disabled={isAssigning}
                  >
                    {t('cityProblem.actions.assign')}
                  </Button>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <TextField
                    select
                    fullWidth
                    label={t('cityProblem.fields.status')}
                    value={nextStatus}
                    onChange={(event) =>
                      onNextStatusChange(
                        event.target.value as CityRequestStatus,
                      )
                    }
                  >
                    {EDITABLE_STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    onClick={onUpdateStatus}
                    disabled={isUpdatingStatus}
                  >
                    {t('cityProblem.actions.updateStatus')}
                  </Button>
                </Stack>

                <Box component="form" onSubmit={onCreateReport}>
                  <Stack spacing={1}>
                    <TextField
                      select
                      label={t('cityProblem.fields.reportType')}
                      value={reportType}
                      onChange={(event) =>
                        onReportTypeChange(event.target.value as ReportType)
                      }
                    >
                      {REPORT_TYPE_OPTIONS.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      multiline
                      minRows={3}
                      label={t('cityProblem.fields.reportText')}
                      value={reportText}
                      onChange={(event) =>
                        onReportTextChange(event.target.value)
                      }
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isCreatingReport}
                    >
                      {t('cityProblem.actions.createReport')}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          ) : null}

          <Divider />

          <Typography variant="h6">{t('cityProblem.chatTitle')}</Typography>
          {isMessageError ? (
            <Alert severity="error">
              {t('cityProblem.errors.messageFailed')}
            </Alert>
          ) : null}

          <Box sx={{ maxHeight: 220, overflow: 'auto', pr: 1 }}>
            <Stack spacing={1.5}>
              {messages.map((item) => (
                <Box key={item.id}>
                  <Typography variant="subtitle2">
                    {item.author.name}
                  </Typography>
                  <Typography variant="body2">{item.content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box component="form" onSubmit={onSendMessage}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                value={messageValue}
                onChange={(event) => onMessageChange(event.target.value)}
                placeholder={t('cityProblem.fields.message')}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isSendingMessage}
              >
                {t('cityProblem.actions.send')}
              </Button>
            </Stack>
          </Box>
        </Stack>
      ) : (
        <Alert severity="error">{t('cityProblem.loadError')}</Alert>
      )}
    </Paper>
  );
}
