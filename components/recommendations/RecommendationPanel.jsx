"use client";

import { Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import RecommendationCard from "./RecommendationCard";
import { retrievalMethodLabels } from "../../constants/app";

export default function RecommendationPanel({
  recommendations,
  loading,
  retrievalMethod,
  onAskAboutProfessor,
}) {
  return (
    <Stack spacing={3} id="recommendations">
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Top recommendations</Typography>
            {retrievalMethod && retrievalMethodLabels[retrievalMethod] ? (
              <Typography variant="caption" color="text.secondary">
                via {retrievalMethodLabels[retrievalMethod]}
              </Typography>
            ) : null}
          </Stack>

          <Stack spacing={2} sx={{ mt: 1.5 }}>
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={110} sx={{ borderRadius: 1.5 }} />
                ))
              : recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={`${recommendation.professor}-${recommendation.subject}`}
                    recommendation={recommendation}
                    onAskAbout={onAskAboutProfessor}
                  />
                ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1">Why students choose us</Typography>
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            {[
              "Hybrid RAG retrieval — vector, semantic, or keyword fallback",
              "Personalized course-fit match scores",
              "Fast answers for deadlines and planning",
            ].map((item) => (
              <Typography key={item} variant="body2" color="text.secondary">
                • {item}
              </Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
