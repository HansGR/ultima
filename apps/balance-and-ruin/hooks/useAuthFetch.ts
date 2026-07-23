import { useCallback } from "react";

export const useAuthFetch = () => {
  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      // Ensure path starts with /
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;

      // If path already starts with /api/v1, don't duplicate it
      const urlPath = normalizedPath.startsWith("/api/v1")
        ? normalizedPath
        : `/api/v1${normalizedPath}`;

      const url = `${BACKEND_URL}${urlPath}`;

      const headers = new Headers(options.headers);
      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", "Bearer " + token);
      }

      try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
          console.warn(
            `Auth error (${response.status}) detected from Narshe endpoint: ${urlPath}`,
          );
          if (typeof window !== "undefined") {
            const hadToken = !!localStorage.getItem("auth_token");
            if (hadToken) {
              // Remove token from storage and notify session provider
              localStorage.removeItem("auth_token");
              window.dispatchEvent(new CustomEvent("auth:expired"));
            }
          }
        }

        return response;
      } catch (error) {
        console.error(`Network or fetch error on endpoint: ${urlPath}`, error);
        throw error;
      }
    },
    [],
  );

  return authFetch;
};
