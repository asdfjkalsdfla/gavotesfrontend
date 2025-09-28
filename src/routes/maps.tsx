import { createFileRoute } from '@tanstack/react-router'
import MapsPage from '../pages/MapsPage.jsx'
import { usePageContext } from '../context/PageContext'

// Wrapper component that gets props from context
function MapsPageWrapper() {
  const pageProps = usePageContext()
  return <MapsPage {...pageProps} />
}

// @ts-expect-error - TanStack Router file-based routing type issue
export const Route = createFileRoute('/maps')({
  component: MapsPageWrapper,
})