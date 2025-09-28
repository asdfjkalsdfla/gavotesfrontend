import { createFileRoute } from '@tanstack/react-router'
import TablePage from '../pages/TablePage.jsx'
import { usePageContext } from '../context/PageContext'

function TablePageWrapper() {
  const pageProps = usePageContext()
  return <TablePage {...pageProps} />
}

export const Route = createFileRoute('/table')({
  component: TablePageWrapper,
})
