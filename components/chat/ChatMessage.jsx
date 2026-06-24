"use client";

import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";

const markdownStyles = {
  "& p": { m: 0, mb: 1, "&:last-child": { mb: 0 } },
  "& ul, & ol": { m: 0, pl: 2.5, mb: 1 },
  "& li": { mb: 0.5 },
  "& strong": { fontWeight: 700 },
  "& code": {
    fontFamily: "monospace",
    fontSize: "0.9em",
    bgcolor: "action.hover",
    px: 0.5,
    borderRadius: 0.5,
  },
};

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
          bgcolor: isAssistant ? "background.paper" : "primary.main",
          color: isAssistant ? "text.primary" : "primary.contrastText",
          borderRadius: 2,
          px: 2.2,
          py: 1.6,
          boxShadow: isAssistant
            ? "0 10px 30px rgba(15,23,42,0.06)"
            : "0 10px 30px rgba(37,99,235,0.24)",
          whiteSpace: isAssistant ? "normal" : "pre-wrap",
          ...(isAssistant ? markdownStyles : {}),
        }}
      >
        {isThinking ? (
          <Box component="span" sx={{ color: "text.secondary", fontStyle: "italic" }}>
            Thinking…
          </Box>
        ) : isAssistant ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          message.content
        )}
      </Box>
    </Box>
  );
}
