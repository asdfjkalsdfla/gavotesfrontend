import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import VotesRoot from "./VotesRoot";
import PrecinctsResultToShapeMatch from "./PrecinctsResultToShapeMatch"
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/precincts/match" element={<PrecinctsResultToShapeMatch />} />
        <Route path="/" element={<VotesRoot />} />
      </Routes>
    </BrowserRouter>
  );
}
