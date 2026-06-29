import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

export function createSessionToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifySessionToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getUserFromRequest(req) {
  let token = req.cookies?.get?.("professor_session")?.value;

  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    const match = cookieHeader?.match(/professor_session=([^;]+)/);
    token = match?.[1];
  }

  if (!token) return null;

  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
