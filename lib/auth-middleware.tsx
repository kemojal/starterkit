"use client";

import { ReactNode, useEffect, useRef } from "react";
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

  // Use refs to track if we've already attempted certain actions
  const hasFetchedUser = useRef(false);
  const hasRedirected = useRef(false);
  const authFailures = useRef(0);

  // Check if user has admin role
  const isAdmin = user?.roles?.some((role) => role.name === "admin") || false;

  useEffect(() => {
    // Reset tracking refs when authentication state changes
    if (!isLoading) {
      hasRedirected.current = false;
    }

    // Add some debug logging (only once per state change)
    console.log("AuthMiddleware state:", {
      isAuthenticated,
      isLoading,
      requireAuth,
      requireAdmin,
      pathname,
      user: user ? `${user.email} (${user.id})` : "null",
      cookies: document.cookie
        ? document.cookie.substring(0, 40) + "..."
        : "None",
      hasFetchedUser: hasFetchedUser.current,
      hasRedirected: hasRedirected.current,
      authFailures: authFailures.current,
    });

    // Limit the number of auth retries to prevent infinite loops
    if (authFailures.current > 3) {
      console.log(
        "Too many auth failures, clearing state and redirecting to login"
      );

      // Clear persisted auth state
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");

        // Only redirect if not already on the login page
        if (pathname !== "/login" && !hasRedirected.current) {
          hasRedirected.current = true;
          router.push("/login");
        }
      }
      return;
    }

    // Attempt to fetch user only once if needed and not already loading
    if (!isLoading && !hasFetchedUser.current) {
      console.log("Attempting to fetch user data");
      hasFetchedUser.current = true; // Mark that we've attempted to fetch

      // If we already have user data from persistence but need to validate
      if (isAuthenticated && user) {
        console.log("User data already exists in store, validating session");
      }

      fetchUser().catch((error) => {
        console.error("Failed to fetch user:", error);
        authFailures.current += 1;

        // Only redirect to login if this is a protected route and we haven't already redirected
        if (requireAuth && !hasRedirected.current) {
          console.log("Redirecting to login");
          hasRedirected.current = true;
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      });

      return; // Exit early to prevent multiple actions in the same effect cycle
    }

    // Redirect logic (only if not already loading and not already redirected)
    if (!isLoading && !hasRedirected.current) {
      // Redirect unauthenticated users away from protected routes
      if (requireAuth && !isAuthenticated) {
        console.log("Protected route, redirecting to login");
        hasRedirected.current = true;
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Redirect authenticated users away from auth pages (login/register)
      if (
        isAuthenticated &&
        (pathname === "/login" || pathname === "/register")
      ) {
        console.log("Already authenticated, redirecting to dashboard");
        hasRedirected.current = true;
        router.push("/dashboard");
        return;
      }

      // Redirect non-admin users away from admin routes
      if (requireAdmin && (!isAuthenticated || !isAdmin)) {
        console.log("Admin route, user is not admin, redirecting to dashboard");
        hasRedirected.current = true;
        router.push("/dashboard");
        return;
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
    user,
  ]);

  // Reset fetch tracking when component unmounts or key dependencies change
  useEffect(() => {
    // If we have user data and authentication status changed, reset fetch flag
    if (isAuthenticated && user) {
      console.log("Auth state validated - user is authenticated with data");
    }

    return () => {
      hasFetchedUser.current = false;
    };
  }, [pathname, isAuthenticated, user]);

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
