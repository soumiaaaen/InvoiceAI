"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { usePathname } from "next/navigation";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900">
        <AuthGuard>
          {isPublicRoute ? (
            children
          ) : (
            <div className="min-h-screen">
              <Sidebar />
              <main className="ml-64 p-8">{children}</main>
            </div>
          )}
        </AuthGuard>
      </body>
    </html>
  );
}