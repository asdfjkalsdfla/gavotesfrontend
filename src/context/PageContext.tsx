import type React from 'react'
import { createContext, useContext } from 'react'

export interface PageContextType {
  isCountyLevel: boolean
  countyFilter: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateActiveSelection: (selection: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateActiveHover: (hover: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeHover: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeSelection: any
  userHasSetLevel: boolean
  updateIsCountyLevel: (isCounty: boolean) => void
}

export const PageContext = createContext<PageContextType | null>(null)

export function usePageContext() {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('usePageContext must be used within a PageProvider')
  }
  return context
}

export function PageProvider({ children, value }: { children: React.ReactNode; value: PageContextType }) {
  return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}