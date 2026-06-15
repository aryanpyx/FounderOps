import "~/styles/globals.css";

import { type Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "~/clients/trpc";
import { ThemeProvider } from "~/components/core/theme-provider";

const primary = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const code = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FounderOps — AI Chief of Staff",
  description: "The typed memory layer for founders. Decisions, commitments, blockers and metrics, captured with provenance.",
  // Favicon is provided by src/app/icon.svg (FounderOps brand mark).
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${primary.variable} ${code.variable}`} suppressHydrationWarning>
      <body className="bg-background min-h-screen font-sans antialiased">
        <ThemeProvider>
          <TRPCReactProvider>
            {children}
            <Toaster />
            <div id="dialog-portal" />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
