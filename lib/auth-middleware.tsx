"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface AuthMiddlewareProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function AuthMiddleware({
  children,
  requireAuth = false,
  requireAdmin = false,
}: AuthMiddlewareProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, fetchUser, isLoading } = useAuthStore();

  // Check if user has admin role
  const isAdmin = user?.roles?.some((role) => role.name === "admin") || false;

  useEffect(() => {
    // If we're not sure if the user is authenticated, try to fetch the user
    if (!isLoading && requireAuth && !isAuthenticated) {
      fetchUser().catch(() => {
        // Redirect to login if authentication fails
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      });
    }

    // Redirect logic
    if (!isLoading) {
      // Redirect unauthenticated users away from protected routes
      if (requireAuth && !isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }

      // Redirect authenticated users away from auth pages (login/register)
      if (
        isAuthenticated &&
        (pathname === "/login" || pathname === "/register")
      ) {
        router.push("/dashboard");
      }

      // Redirect non-admin users away from admin routes
      if (requireAdmin && (!isAuthenticated || !isAdmin)) {
        router.push("/dashboard");
      }
    }
  }, [
    isAuthenticated,
    isAdmin,
    isLoading,
    pathname,
    requireAuth,
    requireAdmin,
    router,
    fetchUser,
  ]);

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render children if authentication requirements are met
  if (
    (requireAuth && isAuthenticated) ||
    (requireAdmin && isAdmin) ||
    !requireAuth
  ) {
    return <>{children}</>;
  }

  // Render nothing while redirecting
  return null;
}
