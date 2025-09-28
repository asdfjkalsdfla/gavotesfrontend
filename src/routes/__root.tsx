import { createRootRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'
import AppLayout from '../components/AppLayout.jsx'

// Define search schema for URL parameters that apply globally
const searchSchema = z.object({
  level: z.string().optional(),
  hideWelcome: z.string().optional(),
  hideOptions: z.string().optional(),
  elevationApproach: z.string().optional(),
  colorApproach: z.string().optional(),
  resultsElectionRaceCurrentID: z.string().optional(),
  resultsElectionRacePerviousID: z.string().optional(),
}).optional()

export const Route = createRootRoute({
  validateSearch: searchSchema,
  component: () => <AppLayout><Outlet /></AppLayout>,
})