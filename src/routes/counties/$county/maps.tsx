import { createFileRoute } from '@tanstack/react-router'
import VotesMap from '../../../Views/VotesMap/index.jsx'
import { useVoterSelectionContext } from '../../../context/VoterSelectionContext'

function CountyMapsPage() {
  const { county } = Route.useParams()
  const countyFilter = county ? decodeURIComponent(county) : null
  const pageProps = useVoterSelectionContext()
  return <VotesMap {...pageProps} countyFilter={countyFilter} initialZoom={10} />
}

export const Route = createFileRoute('/counties/$county/maps')({
  component: CountyMapsPage,
})
