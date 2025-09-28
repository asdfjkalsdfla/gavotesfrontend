import { createFileRoute } from '@tanstack/react-router'
import VotesMap from '../Views/VotesMap/index.jsx'
import { useVoterSelectionContext } from '../context/VoterSelectionContext'

// Wrapper component that gets props from context
function MapsPageWrapper() {
  const pageProps = useVoterSelectionContext()
  return <VotesMap {...pageProps} countyFilter={null} initialZoom={6.7} />
}

export const Route = createFileRoute('/maps')({
  component: MapsPageWrapper,
})
