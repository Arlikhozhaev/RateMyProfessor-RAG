'use client'

import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";

export default function Home() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I am the Rate My Professor support assistant. How can I help you today?"
  }]);
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessages(prevMessages => [
      ...prevMessages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([...messages, { role: "user", content: message }])
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      const processText = async ({ done, value }) => {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        result += text;

        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          return [
            ...prevMessages.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + text }
          ];
        });

        return reader.read().then(processText);
      };

      await reader.read().then(processText);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#f5f5f5"
      p={2}
    >
      <Stack
        direction="column"
        width="500px"
        height="700px"
        borderRadius="8px"
        border="1px solid #ddd"
        boxShadow="0px 4px 8px rgba(0, 0, 0, 0.1)"
        bgcolor="white"
        p={2}
        spacing={3}
      >
        <Typography variant="h5" gutterBottom>
          Rate My Professor Chat
        </Typography>
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow='auto'
          maxHeight='100%'
          p={2}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={msg.role === 'assistant' ? 'flex-start' : 'flex-end'}
              p={1}
            >
              <Box
                bgcolor={msg.role === 'assistant' ? '#e3f2fd' : '#c8e6c9'}
                color="black"
                borderRadius={16}
                p={2}
                maxWidth="80%"
                boxShadow="0px 2px 4px rgba(0, 0, 0, 0.1)"
                overflow="hidden"
                wordBreak="break-word" 
                whiteSpace="pre-wrap" 
              >
                {msg.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Type your message..."
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Button 
            variant='contained' 
            color='primary' 
            onClick={sendMessage}
            size="large"
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
