'use client';
import { UCE_COLORS } from "@/theme";
import styled from "@emotion/styled";
import { Box, Container, Grid, Typography } from "@mui/material";

const FooterBox = styled(Box)({
    backgroundColor: UCE_COLORS.deepBlue.main,
    color: UCE_COLORS.text.light.primary,
    height: `8rem`,
    padding: `2rem 0rem 2rem 0rem`,
});
const FooterContainer = styled(Container)({
    margin: `0 2rem`
})

export default function Footer() {
    return (
        <FooterBox>
            <FooterContainer>
                <Grid container spacing={2}>
                    <Grid size={6}>
                        <Typography>
                            © 2026 Urban Civic Ecosystem. All rights reserved.
                        </Typography>
                    </Grid>
                </Grid>
            </FooterContainer>
        </FooterBox>
    )
}