import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VotesRoot from "./VotesRoot.jsx";

import "./App.css";

const PrecinctsResultToShapeMatch = React.lazy(() => import("./PrecinctsResultToShapeMatch.jsx"));
// import PrecinctsResultToShapeMatch from "./PrecinctsResultToShapeMatch";

const router = createBrowserRouter([
  {
    path: "/precincts/match",
    element: <PrecinctsResultToShapeMatch />,
  },
  {
    path: "/",
    element: <VotesRoot />,
  },
]);

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
    </QueryClientProvider>
  );
}
