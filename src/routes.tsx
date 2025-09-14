import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { z } from 'zod'
import React from 'react'
import VotesRoot from './VotesRoot.jsx'

const PrecinctsResultToShapeMatch = React.lazy(() => import('./PrecinctsResultToShapeMatch.jsx'))

// Define search schema for URL parameters
const searchSchema = z.object({
  CTYNAME: z.string().optional(),
  level: z.string().optional(),
  hideWelcome: z.string().optional(),
  hideOptions: z.string().optional(),
  scatter: z.string().optional(),
  displayMode: z.string().optional(),
  elevationApproach: z.string().optional(),
  colorApproach: z.string().optional(),
  resultsElectionRaceCurrentID: z.string().optional(),
  resultsElectionRacePerviousID: z.string().optional(),
}).optional()

// Create the root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// Create individual routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: searchSchema,
  component: VotesRoot,
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
const routeTree = rootRoute.addChildren([indexRoute, precinctsMatchRoute])

// Create and export the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}