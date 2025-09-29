import type React from 'react'
import { createContext, useContext } from 'react'

export interface VoterSelectionContextType {
  isCountyLevel: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateActiveSelection: (selection: any) => void
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateActiveHover: (hover: any) => void
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeHover: any
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeSelection: any
  userHasSetLevel: boolean
  updateIsCountyLevel: (isCounty: boolean) => void
}

export const VoterSelectionContext = createContext<VoterSelectionContextType | null>(null)

export function useVoterSelectionContext() {
  const context = useContext(VoterSelectionContext)
  if (!context) {
    throw new Error('useVoterSelectionContext must be used within a VoterSelectionProvider')
  }
  return context
}

export function VoterSelectionProvider({ children, value }: { children: React.ReactNode; value: VoterSelectionContextType }) {
  return <VoterSelectionContext.Provider value={value}>{children}</VoterSelectionContext.Provider>
}