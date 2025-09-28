import { createFileRoute } from '@tanstack/react-router'
import VotesScatterPlot from '../../../Views/VotesScatter/index.jsx'
import { useVoterSelectionContext } from '../../../context/VoterSelectionContext'

function CountyScatterPage() {
  const { isCountyLevel, updateActiveHover, updateActiveSelection } = useVoterSelectionContext()
  return <VotesScatterPlot isCountyLevel={isCountyLevel} updateActiveHover={updateActiveHover} updateActiveSelection={updateActiveSelection} />
}

export const Route = createFileRoute('/counties/$county/scatter')({
  component: CountyScatterPage,
})
