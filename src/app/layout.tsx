import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthErrorBoundary } from "@/components/providers/auth-error-boundary";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agency Hub",
  description: "Manage clients and services for your agency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthErrorBoundary>
          <AuthProvider>
            <Providers>
              {children}
              <Toaster />
            </Providers>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
