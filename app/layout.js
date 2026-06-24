import { Inter } from "next/font/google";
import AppThemeProvider from "../components/providers/AppThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "ProfessorMatch AI",
  description:
    "Discover the best professors for your learning goals with AI-powered recommendations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
