'use client';

import { useCityNews } from '@/hooks/useCities';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Divider,
} from '@mui/material';
import FeedRoundedIcon from '@mui/icons-material/FeedRounded';

interface NewsGridProps {
    cityId: string;
}

export default function NewsGrid(props: NewsGridProps) {
    const { cityId } = props;
    const { data: news, isLoading, error } = useCityNews(cityId);

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
                Помилка завантаження новин.
            </Typography>
        );
    }

    if (!news || news.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
                Немає новин для відображення.
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
                <Typography variant="h3">Стрічка новин</Typography>
            </Box>

            <Grid container spacing={3}>
                {news.map((n) => {
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
                                        sx={{ color: 'text.secondary', mb: 1.5, display: 'block' }}
                                    >
                                        {formattedDate} о {formattedTime}
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
                                        Офіційне джерело
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
