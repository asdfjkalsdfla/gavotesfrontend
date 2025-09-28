import { createFileRoute } from '@tanstack/react-router'
import ScatterPage from '../pages/ScatterPage.jsx'
import { usePageContext } from '../context/PageContext'

function ScatterPageWrapper() {
  const pageProps = usePageContext()
  return <ScatterPage {...pageProps} />
}

export const Route = createFileRoute('/scatter')({
  component: ScatterPageWrapper,
})
