"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";

export default function HeroBanner({ user, onLogout, onSampleSearch, onExploreProfessors }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 2,
        background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(37,99,235,0.88))",
        color: "white",
        position: "relative",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(96,165,250,0.25), transparent 18%)",
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="overline" sx={{ opacity: 0.8 }}>
            AI course-fit platform
          </Typography>
          {user ? (
            <Button
              variant="outlined"
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}
              onClick={onLogout}
            >
              Logout
            </Button>
          ) : null}
        </Stack>
        <Typography variant="h3" sx={{ mt: 1 }}>
          Find the professor who fits your next step.
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, maxWidth: 620, opacity: 0.9 }}>
          Match your goals, learning style, and workload preferences to professors who actually
          help you grow.
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: "white",
              color: "primary.main",
              px: 3,
              fontWeight: 700,
              "&:hover": { bgcolor: "#f1f5f9" },
            }}
            onClick={onSampleSearch}
          >
            Try a sample search
          </Button>
          <Button
            variant="outlined"
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}
            onClick={onExploreProfessors}
          >
            Explore professors
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
