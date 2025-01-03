import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
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

export default function App() {
  return <RouterProvider router={router} />;
}
