import { createFileRoute } from '@tanstack/react-router'
import TablePage from '../../../pages/TablePage.jsx'
import { usePageContext } from '../../../context/PageContext'

function CountyTablePage() {
  const pageProps = usePageContext()
  return <TablePage {...pageProps} />
}

export const Route = createFileRoute('/counties/$county/table')({
  component: CountyTablePage,
})
