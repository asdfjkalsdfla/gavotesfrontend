import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VotesRoot from "./VotesRoot";
import PrecinctsResultToShapeMatch from "./PrecinctsResultToShapeMatch";
import 'antd/dist/reset.css';
import "./App.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/precincts/match"  element={<PrecinctsResultToShapeMatch />} />
        <Route path="/"   element={<VotesRoot />} />
      </Routes>
    </Router>
  );
}
