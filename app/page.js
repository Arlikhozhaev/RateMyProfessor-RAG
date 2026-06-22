'use client';

import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

const quickPrompts = [
  "Best professors for software engineering",
  "Who is good at explaining difficult topics?",
  "Need a professor with a lighter workload",
  "Recommend professors for machine learning",
];

const defaultRecommendations = [
  {
    professor: "Dr. Emily Carter",
    subject: "Intro to Computer Science",
    stars: 5,
    review: "Highly engaging and clear explanations.",
  },
  {
    professor: "Dr. Alan Thompson",
    subject: "Artificial Intelligence",
    stars: 5,
    review: "Excellent at making complex concepts approachable.",
  },
  {
    professor: "Dr. Rachel Adams",
    subject: "Machine Learning",
    stars: 5,
    review: "Great practical insight and supportive feedback.",
  },
];

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I’m ProfessorMatch AI — I can help you find professors whose style, subject focus, and reviews match your goals.",
    },
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    userEvents: 0,
    queryEvents: 0,
  });
  const [recommendations, setRecommendations] = useState(defaultRecommendations);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const endRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      setAnalytics({ totalEvents: 0, userEvents: 0, queryEvents: 0 });
    }
  };

  useEffect(() => {
    fetchUser();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const trackEvent = async (eventType, eventValue) => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, eventValue }),
      });
    } catch (error) {
      // ignore analytics errors
    }
  };

  const sendMessage = async (promptOverride) => {
    const text = (promptOverride || message).trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const requestPayload = [...messages, userMessage];
    const nextMessages = [...requestPayload, { role: "assistant", content: "" }];

    setMessages(nextMessages);
    setMessage("");
    setLoading(true);

    try {
      await trackEvent("query", text);

      const recRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const recData = await recRes.json();
      if (recData.matches?.length) {
        setRecommendations(recData.matches);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error("The AI assistant could not respond right now.");
      }

      if (!response.body) {
        throw new Error("No response body received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const processChunk = async () => {
        const { done, value } = await reader.read();
        if (done) {
          return;
        }

        const textChunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const lastIndex = prev.length - 1;
          const lastMessage = prev[lastIndex];
          return [
            ...prev.slice(0, lastIndex),
            { ...lastMessage, content: lastMessage.content + textChunk },
          ];
        });

        return processChunk();
      };

      await processChunk();
      await fetchAnalytics();
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -2),
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong while generating a response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setUser(data.user);
      await trackEvent("signup", authMode === "register" ? "registered" : "logged_in");
      await fetchAnalytics();
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    await fetchAnalytics();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
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
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={3}
          sx={{ mb: 3 }}
        >
          <Box sx={{ flex: 1.2 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(37,99,235,0.88))",
                color: "white",
                position: "relative",
                overflow: "hidden",
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
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  ) : null}
                </Stack>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                  Find the professor who fits your next step.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mt: 1.5, maxWidth: 620, opacity: 0.9 }}
                >
                  Match your goals, learning style, and workload preferences to professors who actually help you grow.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "white",
                      color: "primary.main",
                      px: 3,
                      fontWeight: 700,
                    }}
                    onClick={() => sendMessage(quickPrompts[0])}
                  >
                    Try a sample search
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}
                    onClick={() =>
                      document
                        .getElementById("recommendations")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    Explore professors
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ flex: 0.8 }}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                {user ? (
                  <>
                    <Typography variant="overline" color="text.secondary">
                      Your dashboard
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                      {user.name || user.email}
                    </Typography>
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Queries saved: {analytics.queryEvents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Events tracked: {analytics.userEvents}
                      </Typography>
                    </Stack>
                  </>
                ) : (
                  <>
                    <Typography variant="overline" color="text.secondary">
                      Member access
                    </Typography>
                    <Tabs
                      value={authMode}
                      onChange={(event, newValue) => setAuthMode(newValue)}
                      sx={{ mt: 1 }}
                    >
                      <Tab label="Login" value="login" />
                      <Tab label="Register" value="register" />
                    </Tabs>
                    <Box component="form" onSubmit={handleAuthSubmit} sx={{ mt: 2 }}>
                      {authMode === "register" ? (
                        <TextField
                          fullWidth
                          label="Name"
                          value={authForm.name}
                          onChange={(event) =>
                            setAuthForm({ ...authForm, name: event.target.value })
                          }
                          sx={{ mb: 1.5 }}
                        />
                      ) : null}
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={authForm.email}
                        onChange={(event) =>
                          setAuthForm({ ...authForm, email: event.target.value })
                        }
                        sx={{ mb: 1.5 }}
                      />
                      <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={authForm.password}
                        onChange={(event) =>
                          setAuthForm({ ...authForm, password: event.target.value })
                        }
                        sx={{ mb: 1.5 }}
                      />
                      {authError ? (
                        <Typography color="error" variant="body2">
                          {authError}
                        </Typography>
                      ) : null}
                      <Button type="submit" variant="contained" fullWidth>
                        {authMode === "login" ? "Login" : "Create account"}
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={3}
          sx={{ alignItems: "stretch" }}
        >
          <Box sx={{ flex: 1.8 }}>
            <Paper sx={{ borderRadius: 4, overflow: "hidden", height: "100%" }}>
              <Box
                sx={{
                  p: 2,
                  background: "linear-gradient(90deg, #eff6ff, #ffffff)",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      ProfessorMatch AI chat
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Real-time guidance for course selection
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: "primary.main" }}>AI</Avatar>
                </Stack>
              </Box>

              <Box sx={{ p: 2, bgcolor: "#f8fafc", height: 520, overflowY: "auto" }}>
                <Stack spacing={2}>
                  {messages.map((msg, index) => (
                    <Box
                      key={`${msg.role}-${index}`}
                      sx={{
                        display: "flex",
                        justifyContent:
                          msg.role === "assistant" ? "flex-start" : "flex-end",
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: { xs: "90%", md: "78%" },
                          bgcolor: msg.role === "assistant" ? "white" : "primary.main",
                          color: msg.role === "assistant" ? "text.primary" : "white",
                          borderRadius: 3,
                          px: 2.2,
                          py: 1.6,
                          boxShadow:
                            msg.role === "assistant"
                              ? "0 10px 30px rgba(15,23,42,0.06)"
                              : "0 10px 30px rgba(37,99,235,0.24)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.content}
                      </Box>
                    </Box>
                  ))}
                  {loading && (
                    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                      <Box
                        sx={{
                          bgcolor: "white",
                          borderRadius: 3,
                          px: 2,
                          py: 1,
                          color: "text.secondary",
                        }}
                      >
                        Thinking...
                      </Box>
                    </Box>
                  )}
                  <div ref={endRef} />
                </Stack>
              </Box>

              <Divider />

              <Box sx={{ p: 2, bgcolor: "white" }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                  {quickPrompts.map((prompt) => (
                    <Chip
                      key={prompt}
                      label={prompt}
                      variant="outlined"
                      clickable
                      onClick={() => sendMessage(prompt)}
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
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    variant="contained"
                    onClick={() => sendMessage()}
                    disabled={loading}
                    sx={{ minWidth: 140, py: 1.6 }}
                  >
                    {loading ? "Sending..." : "Send"}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ flex: 0.95 }} id="recommendations">
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Top recommendations
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 1.5 }}>
                    {recommendations.map((recommendation) => (
                      <Box key={`${recommendation.professor}-${recommendation.subject}`}>
                        <Stack direction="row" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {recommendation.professor}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {recommendation.subject}
                            </Typography>
                          </Box>
                          <Chip label={`${recommendation.stars || 5}.0 ★`} color="warning" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {recommendation.review || "Strong match for the requested criteria."}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Why students choose us
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                    {[
                      "Data-backed recommendations",
                      "Personalized course-fit scores",
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
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

