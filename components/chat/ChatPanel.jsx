"use client";

import { Avatar, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import ChatMessage from "../chat/ChatMessage";
import { quickPrompts } from "../../constants/app";

export default function ChatPanel({
  messages,
  message,
  loading,
  chatContainerRef,
  onMessageChange,
  onSendMessage,
  onKeyDown,
}) {
  return (
    <Paper sx={{ borderRadius: 2, overflow: "hidden", height: "100%" }}>
      <Box
        sx={{
          p: 2,
          background: "linear-gradient(90deg, #eff6ff, #ffffff)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1">ProfessorMatch AI chat</Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time guidance for course selection
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: "primary.main" }}>AI</Avatar>
        </Stack>
      </Box>

      <Box
        ref={chatContainerRef}
        role="log"
        aria-live="polite"
        aria-busy={loading}
        aria-label="Chat messages"
        sx={{ p: 2, bgcolor: "background.default", height: 520, overflowY: "auto" }}
      >
        <Stack spacing={2}>
          {messages.map((msg, index) => (
            <ChatMessage key={`${msg.role}-${index}`} message={msg} />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ p: 2, bgcolor: "background.paper" }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
          {quickPrompts.map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              variant="outlined"
              clickable
              disabled={loading}
              onClick={() => onSendMessage(prompt)}
            />
          ))}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask about professors, teaching style, workload, or course fit..."
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={() => onSendMessage()}
            disabled={loading || !message.trim()}
            sx={{ minWidth: 140, py: 1.6 }}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
