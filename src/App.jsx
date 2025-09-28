import React from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./App.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen.ts";

// Create a new router instance with file-based routes
const router = createRouter({ routeTree });

// Import dev tools conditionally
const TanStackRouterDevtools =
  import.meta.env.MODE === "production"
    ? () => null
    : React.lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <React.Suspense>
        <TanStackRouterDevtools router={router} />
      </React.Suspense>
    </QueryClientProvider>
  );
}
