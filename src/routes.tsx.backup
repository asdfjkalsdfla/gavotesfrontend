import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { z } from 'zod'
import React from 'react'
import AppLayout from './components/AppLayout.jsx'
import MapsPage from './routes/MapsPage.jsx'
import ScatterPage from './routes/ScatterPage.jsx'
import TablePage from './routes/TablePage.jsx'

const PrecinctsResultToShapeMatch = React.lazy(() => import('./PrecinctsResultToShapeMatch.jsx'))

// Define search schema for URL parameters
const searchSchema = z.object({
  level: z.string().optional(),
  hideWelcome: z.string().optional(),
  hideOptions: z.string().optional(),
  elevationApproach: z.string().optional(),
  colorApproach: z.string().optional(),
  resultsElectionRaceCurrentID: z.string().optional(),
  resultsElectionRacePerviousID: z.string().optional(),
}).optional()

// Create the root route
const rootRoute = createRootRoute({
  component: () => <AppLayout><Outlet /></AppLayout>,
})

// Create individual routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: searchSchema,
  component: MapsPage,
})

// Routes for different display modes without county
const mapsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/maps',
  validateSearch: searchSchema,
  component: MapsPage,
})

const scatterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scatter',
  validateSearch: searchSchema,
  component: ScatterPage,
})

const tableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/table',
  validateSearch: searchSchema,
  component: TablePage,
})

// Routes for different display modes with county
const countyMapsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/counties/$county/maps',
  validateSearch: searchSchema,
  component: MapsPage,
})

const countyScatterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/counties/$county/scatter',
  validateSearch: searchSchema,
  component: ScatterPage,
})

const countyTableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/counties/$county/table',
  validateSearch: searchSchema,
  component: TablePage,
})

const precinctsMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/precincts/match',
  component: () => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <PrecinctsResultToShapeMatch />
    </React.Suspense>
  ),
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute, 
  mapsRoute, 
  scatterRoute, 
  tableRoute, 
  countyMapsRoute, 
  countyScatterRoute, 
  countyTableRoute, 
  precinctsMatchRoute
])

// Create and export the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}