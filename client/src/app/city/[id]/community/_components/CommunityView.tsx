'use client';

import { useCityCommunity } from "@/hooks/useCities";
import { Box, Typography, Card, CardContent, CircularProgress, Grid, Divider, Avatar, AvatarGroup, Paper, TextField, IconButton } from "@mui/material";
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';

export default function CommunityView({ cityId }: { cityId: string }) {
    const { data: community, isLoading, error } = useCityCommunity(cityId);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !community) {
        return (
            <Typography color="error" sx={{ mt: 2 }}>
                Помилка завантаження спільноти.
            </Typography>
        );
    }

    const posts = community.posts || [];
    const chat = community.chats?.[0];
    const messages = chat?.messages || [];

    return (
        <Box sx={{ mt: 2, pb: 4 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                    sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'rgba(92, 103, 125, 0.1)',
                        color: 'primary.main',
                        display: 'flex',
                    }}
                >
                    <GroupsRoundedIcon />
                </Box>
                <Box>
                    <Typography variant="h3">{community.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{community.description}</Typography>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Left Column: Members & Posts */}
                <Grid size={{ xs: 12, md: 7, lg: 8 }}>
                    
                    {/* Mock Members Section */}
                    <Card elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Учасники спільноти (1,248)</Typography>
                            <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 36, height: 36, fontSize: '0.875rem' } }}>
                                <Avatar alt="Олександр" src="/static/images/avatar/1.jpg" />
                                <Avatar alt="Марія" src="/static/images/avatar/2.jpg" />
                                <Avatar alt="Іван" src="/static/images/avatar/3.jpg" />
                                <Avatar alt="Анна" src="/static/images/avatar/4.jpg" />
                                <Avatar alt="Петро" src="/static/images/avatar/5.jpg" />
                                <Avatar alt="Олена" src="/static/images/avatar/6.jpg" />
                                <Avatar alt="Денис" src="/static/images/avatar/7.jpg" />
                            </AvatarGroup>
                        </CardContent>
                    </Card>

                    {/* Posts Section */}
                    <Typography variant="h5" sx={{ mb: 3 }}>Останні публікації</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {posts.map((post) => {
                            const date = new Date(post.createdAt);
                            const formattedDate = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
                            const formattedTime = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                            const authorName = post.author ? post.author.name : 'Невідомий користувач';

                            return (
                                <Card key={post.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                            <Avatar sx={{ bgcolor: 'success.light', width: 40, height: 40 }}>
                                                <PersonRoundedIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                    {authorName}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {formattedDate} о {formattedTime}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {post.content}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {posts.length === 0 && (
                            <Typography color="text.secondary">Поки що немає публікацій.</Typography>
                        )}
                    </Box>
                </Grid>

                {/* Right Column: Chat Widget */}
                <Grid size={{ xs: 12, md: 5, lg: 4 }}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            height: '600px', // Fixed height for the chat widget
                            position: 'sticky',
                            top: 24,
                        }}
                    >
                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ChatBubbleOutlineRoundedIcon color="primary" />
                            <Typography variant="h6">Чат громади</Typography>
                        </Box>
                        
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
                            {messages.map((msg) => {
                                const time = new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                                const authorName = msg.author ? msg.author.name : 'Гість';
                                // Mock logic: assume some messages are 'mine' based on random or we can just render all the same for now
                                // Actually, let's just render all left-aligned for simplicity since we don't have current user id easily available here
                                return (
                                    <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                                            {authorName} • {time}
                                        </Typography>
                                        <Box sx={{ 
                                            p: 1.5, 
                                            bgcolor: 'white', 
                                            borderRadius: 2,
                                            borderTopLeftRadius: 4,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            alignSelf: 'flex-start',
                                            maxWidth: '90%'
                                        }}>
                                            <Typography variant="body2">{msg.content}</Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                            {messages.length === 0 && (
                                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                                    Немає повідомлень. Почніть спілкування першим!
                                </Typography>
                            )}
                        </Box>
                        
                        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    placeholder="Написати повідомлення..." 
                                    variant="outlined"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
                                />
                                <IconButton color="primary" sx={{ bgcolor: 'primary.light', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', opacity: 0.8 } }}>
                                    <SendRoundedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
