'use client';
import { UCE_COLORS } from "@/theme";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const HeaderBox = styled(Box)({
    marginBottom: "2rem",
    color: UCE_COLORS.text.light.primary,
})

export default function Header() {
    return (
        <HeaderBox>
            <AppBar>
                <Toolbar>
                    <Typography>
                        Urban Civic Ecosystem
                    </Typography>
                    <Box>
                        <Button>
                            Auth
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
        </HeaderBox>
    )
}