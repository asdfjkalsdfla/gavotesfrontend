import { createFileRoute } from '@tanstack/react-router'
import ScatterPage from '../../../pages/ScatterPage.jsx'
import { usePageContext } from '../../../context/PageContext'

function CountyScatterPage() {
  const pageProps = usePageContext()
  return <ScatterPage {...pageProps} />
}

export const Route = createFileRoute('/counties/$county/scatter')({
  component: CountyScatterPage,
})
