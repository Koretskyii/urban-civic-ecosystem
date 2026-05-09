'use client';

import { useCityPosts } from "@/hooks/useCities";
import { Box, Typography, Card, CardContent, CircularProgress, Grid, Divider, Avatar } from "@mui/material";
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

export default function PostsGrid({ cityId }: { cityId: string }) {
    const { data: posts, isLoading, error } = useCityPosts(cityId);

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
                Помилка завантаження постів.
            </Typography>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
                Немає постів для відображення.
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
                        bgcolor: 'rgba(49, 107, 80, 0.1)',
                        color: 'success.main',
                        display: 'flex',
                    }}
                >
                    <ArticleRoundedIcon />
                </Box>
                <Typography variant="h3">Пости спільноти</Typography>
            </Box>

            <Grid container spacing={3}>
                {posts.map((post) => {
                    const date = new Date(post.createdAt);
                    const formattedDate = date.toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    const formattedTime = date.toLocaleTimeString('uk-UA', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={post.id}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderTop: '4px solid',
                                    borderTopColor: 'success.main',
                                    borderRadius: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        boxShadow: '0 8px 24px rgba(49, 107, 80, 0.12)',
                                        transform: 'translateY(-4px)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}>
                                            <PersonRoundedIcon fontSize="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {formattedDate} о {formattedTime}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="body1" sx={{ color: 'text.primary', flexGrow: 1, whiteSpace: 'pre-wrap' }}>
                                        {post.content}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                                        Публікація мешканця
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    )
}
