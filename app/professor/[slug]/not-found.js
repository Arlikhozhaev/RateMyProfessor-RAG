import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export default function ProfessorNotFound() {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Professor not found
      </Typography>
      <Typography color="text.secondary" align="center">
        We could not find a professor matching that profile in our dataset.
      </Typography>
      <Button component={Link} href="/" variant="contained">
        Return home
      </Button>
    </Box>
  );
}
