'use client';

import { useCallback, useEffect, useState } from "react";
import { Box, Stack } from "@mui/material";
import HeroBanner from "../components/layout/HeroBanner";
import AuthPanel from "../components/auth/AuthPanel";
import ChatPanel from "../components/chat/ChatPanel";
import RecommendationPanel from "../components/recommendations/RecommendationPanel";
import { quickPrompts } from "../constants/app";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

export default function Home() {
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    userEvents: 0,
    queryEvents: 0,
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch {
      setAnalytics({ totalEvents: 0, userEvents: 0, queryEvents: 0 });
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const {
    user,
    authMode,
    authForm,
    authError,
    setAuthMode,
    setAuthForm,
    handleAuthSubmit,
    handleLogout,
  } = useAuth(fetchAnalytics);

  const {
    messages,
    message,
    loading,
    recommendations,
    recommendationsLoading,
    retrievalMethod,
    chatContainerRef,
    setMessage,
    sendMessage,
    askAboutProfessor,
    handleKeyDown,
  } = useChat(fetchAnalytics);

  const scrollToRecommendations = () => {
    document.getElementById("recommendations")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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
      <Box sx={{ maxWidth: 1300, mx: "auto" }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ mb: 3 }}>
          <Box sx={{ flex: 1.2 }}>
            <HeroBanner
              user={user}
              onLogout={handleLogout}
              onSampleSearch={() => sendMessage(quickPrompts[0])}
              onExploreProfessors={scrollToRecommendations}
            />
          </Box>
          <Box sx={{ flex: 0.8 }}>
            <AuthPanel
              user={user}
              analytics={analytics}
              authMode={authMode}
              authForm={authForm}
              authError={authError}
              onAuthModeChange={(_, value) => setAuthMode(value)}
              onAuthFormChange={setAuthForm}
              onAuthSubmit={handleAuthSubmit}
            />
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", xl: "row" }} spacing={3} sx={{ alignItems: "stretch" }}>
          <Box sx={{ flex: 1.8 }}>
            <ChatPanel
              messages={messages}
              message={message}
              loading={loading}
              chatContainerRef={chatContainerRef}
              onMessageChange={setMessage}
              onSendMessage={sendMessage}
              onKeyDown={handleKeyDown}
            />
          </Box>
          <Box sx={{ flex: 0.95 }}>
            <RecommendationPanel
              recommendations={recommendations}
              loading={recommendationsLoading}
              retrievalMethod={retrievalMethod}
              onAskAboutProfessor={askAboutProfessor}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
