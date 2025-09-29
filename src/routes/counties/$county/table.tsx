import { createFileRoute } from '@tanstack/react-router'
import VotesTable from '../../../Views/VotesTable/index.jsx'
import { useVoterSelectionContext } from '../../../context/VoterSelectionContext'

function CountyTablePage() {
  const { county } = Route.useParams()
  const countyFilter = county ? decodeURIComponent(county) : null
  const { isCountyLevel, updateIsCountyLevel, updateActiveSelection } = useVoterSelectionContext()
  return <VotesTable isCountyLevel={isCountyLevel} countyFilter={countyFilter} updateIsCountyLevel={updateIsCountyLevel} updateActiveSelection={updateActiveSelection} />
}

export const Route = createFileRoute('/counties/$county/table')({
  component: CountyTablePage,
})
