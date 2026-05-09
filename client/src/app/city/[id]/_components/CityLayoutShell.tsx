'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import FeedRoundedIcon from '@mui/icons-material/FeedRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useCityById } from '@/hooks';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

const NAV_ITEMS = [
  { label: 'Головна', icon: <HomeRoundedIcon />, path: '' },
  { label: 'Новини', icon: <FeedRoundedIcon />, path: '/news' },
  { label: 'Пости', icon: <ArticleRoundedIcon />, path: '/posts' },
  { label: "Ком'юніті", icon: <GroupsRoundedIcon />, path: '/community' },
  {
    label: 'Реєстрація проблеми',
    icon: <ReportProblemRoundedIcon />,
    path: '/problem',
    accent: true,
  },
];

export default function CityLayoutShell({
  cityId,
  children,
}: {
  cityId: string;
  children: React.ReactNode;
}) {
  const { data: city, isLoading } = useCityById(cityId);
  const pathname = usePathname();
  const router = useRouter();
  const baseRoute = `/city/${cityId}`;
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      {/* Sidebar — in document flow, never overlaps footer */}
      <Box
        sx={{
          width,
          minWidth: width,
          backgroundColor: '#1A3A57',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: '1',
          minHeight: '80vh',
        }}
      >
        {/* Toggle button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
            p: 1,
            pt: 1.5,
          }}
        >
          <Tooltip title={collapsed ? 'Розгорнути' : 'Згорнути'} placement="right">
            <IconButton
              onClick={() => setCollapsed((v) => !v)}
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.6)',
                '&:hover': { color: 'white', bgcolor: 'primary.light' },
              }}
            >
              {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* City brand */}
        {!collapsed && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <LocationCityRoundedIcon sx={{ fontSize: 28, color: 'secondary.light', flexShrink: 0 }} />
              <Typography
                variant="h3"
                sx={{ color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {isLoading ? '...' : city?.name}
              </Typography>
            </Box>
            {city?.region && (
              <Chip
                label={city.region}
                size="small"
                sx={{ bgcolor: 'primary.light', color: 'white', fontSize: '0.75rem', height: 22 }}
              />
            )}
          </Box>
        )}

        {/* Collapsed city icon */}
        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2 }}>
            <Tooltip title={isLoading ? '...' : (city?.name ?? '')} placement="right">
              <LocationCityRoundedIcon sx={{ fontSize: 28, color: 'secondary.light' }} />
            </Tooltip>
          </Box>
        )}

        <Divider sx={{ borderColor: 'primary.light', mx: collapsed ? 1 : 2 }} />

        {/* Navigation */}
        <List sx={{ px: collapsed ? 0.5 : 1.5, pt: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const fullPath = `${baseRoute}${item.path}`;
            const isActive =
              item.path === '' ? pathname === baseRoute : pathname.startsWith(fullPath);

            return (
              <Tooltip
                key={item.path}
                title={collapsed ? item.label : ''}
                placement="right"
              >
                <ListItemButton
                  onClick={() => router.push(fullPath)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    px: collapsed ? 1.5 : 2,
                    py: 1.2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    minWidth: 0,
                    bgcolor: isActive
                      ? item.accent ? 'error.main' : 'secondary.main'
                      : item.accent ? 'rgba(208, 0, 0, 0.15)' : 'transparent',
                    color: isActive ? 'white' : item.accent ? 'error.light' : 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      bgcolor: isActive
                        ? item.accent ? 'error.dark' : 'secondary.dark'
                        : item.accent ? 'rgba(208, 0, 0, 0.25)' : 'primary.light',
                      color: 'white',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'inherit',
                      minWidth: collapsed ? 0 : 36,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: { fontSize: '0.95rem', fontWeight: isActive ? 700 : 400, noWrap: true },
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          p: 4,
          bgcolor: 'background.default',
          minWidth: 0,
          transition: 'all 0.25s ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
