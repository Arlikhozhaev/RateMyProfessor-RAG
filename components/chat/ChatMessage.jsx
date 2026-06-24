import { Box } from "@mui/material";

export default function ChatMessage({ message }) {
  const isAssistant = message.role === "assistant";
  const isThinking = isAssistant && message.pending && !message.content;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isAssistant ? "flex-start" : "flex-end",
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: "90%", md: "78%" },
          bgcolor: isAssistant ? "white" : "primary.main",
          color: isAssistant ? "text.primary" : "white",
          borderRadius: 3,
          px: 2.2,
          py: 1.6,
          boxShadow: isAssistant
            ? "0 10px 30px rgba(15,23,42,0.06)"
            : "0 10px 30px rgba(37,99,235,0.24)",
          whiteSpace: "pre-wrap",
        }}
      >
        {isThinking ? (
          <Box component="span" sx={{ color: "text.secondary", fontStyle: "italic" }}>
            Thinking…
          </Box>
        ) : (
          message.content
        )}
      </Box>
    </Box>
  );
}
