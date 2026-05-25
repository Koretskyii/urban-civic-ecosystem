'use client';

import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { usePermission } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useCityNews,
  useCreateNews,
  useDeleteNews,
  useUpdateNews,
} from '@/hooks/useCities';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  InputAdornment,
  Switch,
  TextField,
  Divider,
  Typography,
} from '@mui/material';
import FeedRoundedIcon from '@mui/icons-material/FeedRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { useTranslations } from 'next-intl';
import { FormEvent, useMemo, useState } from 'react';

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
    if (!news) {
      return [];
    }

    if (canManageNews) {
      return news;
    }

    // Defensive UI filter: citizens never see soft-deleted items even if backend query changes.
    return news.filter((item) => !item.deletedAt);
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
        payload: {
          title,
          content,
        },
      });

      setNewTitle('');
      setNewContent('');
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
    if (!editingNewsId) {
      return;
    }

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
        payload: {
          title,
          content,
        },
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2 }}>
        {t('news.loadError')}
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: 'rgba(63, 136, 197, 0.1)',
            color: 'secondary.main',
            display: 'flex',
          }}
        >
          <FeedRoundedIcon />
        </Box>
        <Typography variant="h3">{t('news.title')}</Typography>
      </Box>

      {canManageView ? (
        <Box sx={{ mb: 3 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          {createNewsMutation.isError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {t('news.createError')}
            </Alert>
          ) : null}
          {updateNewsMutation.isError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {t('news.updateError')}
            </Alert>
          ) : null}
          {deleteNewsMutation.isError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {t('news.deleteError')}
            </Alert>
          ) : null}
          {canCreateNews ? (
            <Box
              component="form"
              onSubmit={onCreateNews}
              sx={{
                display: 'grid',
                gap: 1.5,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5">{t('news.createTitle')}</Typography>
              <TextField
                label={t('news.fields.title')}
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                required
              />
              <TextField
                label={t('news.fields.content')}
                value={newContent}
                onChange={(event) => setNewContent(event.target.value)}
                multiline
                minRows={4}
                required
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={createNewsMutation.isPending}
                >
                  {createNewsMutation.isPending
                    ? t('news.actions.creating')
                    : t('news.actions.create')}
                </Button>
              </Box>
            </Box>
          ) : null}

          <Box
            sx={{
              mt: 2,
              display: 'flex',
              gap: 1.5,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
            }}
          >
            <TextField
              label={t('news.searchLabel')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
              placeholder={t('news.searchPlaceholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            {canManageNews ? (
              <FormControlLabel
                control={
                  <Switch
                    checked={includeDeleted}
                    onChange={(event) =>
                      setIncludeDeleted(event.target.checked)
                    }
                  />
                }
                label={t('news.includeDeleted')}
              />
            ) : null}
          </Box>
        </Box>
      ) : null}

      {visibleNews.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {t('news.empty')}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {visibleNews.map((n) => {
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
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={n.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderTop: '4px solid',
                    borderTopColor: 'secondary.main',
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(63, 136, 197, 0.12)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        mb: 1.5,
                        display: 'block',
                      }}
                    >
                      {formattedDate} {t('common.timeSeparator')}{' '}
                      {formattedTime}
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: 'text.primary',
                        lineHeight: 1.3,
                      }}
                    >
                      {n.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', flexGrow: 1, mb: 2 }}
                    >
                      {n.content}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography
                      variant="caption"
                      sx={{ color: 'primary.light', fontWeight: 500 }}
                    >
                      {n.deletedAt
                        ? t('news.deletedLabel')
                        : t('news.officialSource')}
                    </Typography>
                    {(canUpdateNews || canDeleteNews) && !n.deletedAt ? (
                      <Box
                        sx={{
                          mt: 1.5,
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'flex-end',
                        }}
                      >
                        {canUpdateNews ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditRoundedIcon />}
                            onClick={() =>
                              startEdit({
                                id: n.id,
                                title: n.title,
                                content: n.content,
                              })
                            }
                          >
                            {t('news.actions.edit')}
                          </Button>
                        ) : null}
                        {canDeleteNews ? (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteRoundedIcon />}
                            onClick={() => onDeleteNews(n.id)}
                            disabled={deleteNewsMutation.isPending}
                          >
                            {t('news.actions.delete')}
                          </Button>
                        ) : null}
                      </Box>
                    ) : null}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={Boolean(editingNewsId)}
        onClose={() => setEditingNewsId(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{t('news.editTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField
            label={t('news.fields.title')}
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            required
          />
          <TextField
            label={t('news.fields.content')}
            value={editingContent}
            onChange={(event) => setEditingContent(event.target.value)}
            multiline
            minRows={5}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingNewsId(null)}>
            {t('news.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={onSaveEdit}
            disabled={updateNewsMutation.isPending}
          >
            {updateNewsMutation.isPending
              ? t('news.actions.saving')
              : t('news.actions.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
