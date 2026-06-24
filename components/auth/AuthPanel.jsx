"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

export default function AuthPanel({ user, analytics, authMode, authForm, authError, onAuthModeChange, onAuthFormChange, onAuthSubmit }) {
  return (
    <Card sx={{ height: "100%" }}>
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
            <Tabs value={authMode} onChange={onAuthModeChange} sx={{ mt: 1 }}>
              <Tab label="Login" value="login" />
              <Tab label="Register" value="register" />
            </Tabs>
            <Box component="form" onSubmit={onAuthSubmit} sx={{ mt: 2 }}>
              {authMode === "register" ? (
                <TextField
                  fullWidth
                  label="Name"
                  value={authForm.name}
                  onChange={(event) => onAuthFormChange({ ...authForm, name: event.target.value })}
                  sx={{ mb: 1.5 }}
                />
              ) : null}
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={authForm.email}
                onChange={(event) => onAuthFormChange({ ...authForm, email: event.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  onAuthFormChange({ ...authForm, password: event.target.value })
                }
                sx={{ mb: 1.5 }}
              />
              {authError ? (
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>
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
  );
}
