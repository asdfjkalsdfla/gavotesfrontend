import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import VotesRoot from "./VotesRoot";
const PrecinctsResultToShapeMatch = React.lazy(() => import('./PrecinctsResultToShapeMatch'));
// import PrecinctsResultToShapeMatch from "./PrecinctsResultToShapeMatch";
import "antd/dist/reset.css";
import "./App.css";

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
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
