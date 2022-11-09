import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import VotesRoot from "./VotesRoot";
import PrecinctsResultToShapeMatch from "./PrecinctsResultToShapeMatch"
import "./App.css";

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/precincts/match">
          <PrecinctsResultToShapeMatch />
        </Route>
        <Route path="/">
          <VotesRoot />
        </Route>
      </Switch>
    </Router>
  );
}
