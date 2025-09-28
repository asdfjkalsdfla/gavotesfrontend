import { createFileRoute } from '@tanstack/react-router'
import VotesTable from '../Views/VotesTable/index.jsx'
import { useVoterSelectionContext } from '../context/VoterSelectionContext'

function TablePageWrapper() {
  const { isCountyLevel, updateIsCountyLevel, updateActiveSelection } = useVoterSelectionContext()
  return <VotesTable isCountyLevel={isCountyLevel} countyFilter={null} updateIsCountyLevel={updateIsCountyLevel} updateActiveSelection={updateActiveSelection} />
}

export const Route = createFileRoute('/table')({
  component: TablePageWrapper,
})
