"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";

function scoreColor(score) {
  if (score >= 80) return "success";
  if (score >= 60) return "primary";
  return "default";
}

export default function RecommendationCard({ recommendation, onAskAbout }) {
  const hasMatchScore = typeof recommendation.matchScore === "number";

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {recommendation.professor}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {recommendation.subject}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75} flexShrink={0}>
          {hasMatchScore ? (
            <Chip
              label={`${recommendation.matchScore}% match`}
              size="small"
              color={scoreColor(recommendation.matchScore)}
            />
          ) : null}
          <Chip
            label={`${recommendation.stars || 5}.0 ★`}
            size="small"
            color="warning"
            variant="outlined"
          />
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {recommendation.review || "Strong match for the requested criteria."}
      </Typography>
      {onAskAbout ? (
        <Typography
          component="button"
          variant="caption"
          onClick={() => onAskAbout(recommendation)}
          sx={{
            mt: 1.5,
            display: "inline-block",
            border: "none",
            background: "none",
            color: "primary.main",
            fontWeight: 600,
            cursor: "pointer",
            p: 0,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Ask about this professor →
        </Typography>
      ) : null}
    </Box>
  );
}
