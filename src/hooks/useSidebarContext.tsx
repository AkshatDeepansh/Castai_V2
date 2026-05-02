import { createContext, useContext, type ReactNode } from "react"
import { useSidebarState } from "./useSidebarState"

type SidebarContextValue = ReturnType<typeof useSidebarState>

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const state = useSidebarState()
  return <SidebarContext.Provider value={state}>{children}</SidebarContext.Provider>
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider")
  return ctx
}
