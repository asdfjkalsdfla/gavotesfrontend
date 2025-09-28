import { createFileRoute } from '@tanstack/react-router'
import MapsPage from '../../../pages/MapsPage.jsx'
import { usePageContext } from '../../../context/PageContext'

function CountyMapsPage() {
  const pageProps = usePageContext()
  return <MapsPage {...pageProps} />
}

export const Route = createFileRoute('/counties/$county/maps')({
  component: CountyMapsPage,
})
