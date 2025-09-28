import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

const PrecinctsResultToShapeMatch = React.lazy(() => import('../../PrecinctsResultToShapeMatch.jsx'))

// @ts-expect-error - TanStack Router file-based routing type issue
export const Route = createFileRoute('/precincts/match')({
  component: () => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <PrecinctsResultToShapeMatch />
    </React.Suspense>
  ),
})