import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { loadReviews } from "../../../lib/retrieval/loadReviews.js";
import {
  findProfessorBySlug,
  getRelatedProfessors,
  professorToSlug,
} from "../../../lib/professors.js";

export async function generateStaticParams() {
  const reviews = await loadReviews();
  return reviews.map((review) => ({ slug: professorToSlug(review.professor) }));
}

export async function generateMetadata({ params }) {
  const reviews = await loadReviews();
  const professor = findProfessorBySlug(params.slug, reviews);

  if (!professor) {
    return { title: "Professor not found | ProfessorMatch AI" };
  }

  return {
    title: `${professor.professor} — ${professor.subject} | ProfessorMatch AI`,
    description: professor.review,
  };
}

export default async function ProfessorPage({ params }) {
  const reviews = await loadReviews();
  const professor = findProfessorBySlug(params.slug, reviews);

  if (!professor) {
    notFound();
  }

  const related = getRelatedProfessors(professor, reviews);
  const chatPrompt = encodeURIComponent(
    `Tell me more about ${professor.professor} and whether they're a good fit for ${professor.subject}.`
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(37, 99, 235, 0.08), transparent 20%), linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
        px: { xs: 2, md: 6 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 820, mx: "auto" }}>
        <Button component={Link} href="/" sx={{ mb: 2 }}>
          ← Back to ProfessorMatch AI
        </Button>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Professor profile
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {professor.professor}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mt: 0.5 }}>
                  {professor.subject}
                </Typography>
              </Box>
              <Chip label={`${professor.stars}.0 ★`} color="warning" sx={{ fontWeight: 700 }} />
            </Stack>

            <Typography variant="body1" sx={{ mt: 3, lineHeight: 1.7 }}>
              {professor.review}
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                component={Link}
                href={`/?prompt=${chatPrompt}`}
                variant="contained"
              >
                Ask AI about this professor
              </Button>
              <Button component={Link} href="/#recommendations" variant="outlined">
                Browse all recommendations
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {related.length > 0 ? (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Related professors
              </Typography>
              <Stack spacing={1.5}>
                {related.map((item) => (
                  <Box
                    key={item.professor}
                    component={Link}
                    href={`/professor/${professorToSlug(item.professor)}`}
                    sx={{
                      display: "block",
                      p: 2,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      textDecoration: "none",
                      color: "inherit",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {item.professor}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.subject} · {item.stars}.0 ★
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Box>
    </Box>
  );
}
