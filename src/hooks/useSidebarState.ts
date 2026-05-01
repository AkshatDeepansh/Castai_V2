import { useState, useCallback } from "react"

const STORAGE_KEY = "sidebar-state"

export const SIDEBAR_WIDTH_DEFAULT = 208
export const SIDEBAR_WIDTH_MIN = 208
export const SIDEBAR_WIDTH_MAX = 291
export const SIDEBAR_WIDTH_COLLAPSED = 52
export const SIDEBAR_COLLAPSE_THRESHOLD = 160

type SidebarMode = "expanded" | "collapsed"

type PersistedState = {
  mode: SidebarMode
  width: number
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>
      if (
        (parsed.mode === "expanded" || parsed.mode === "collapsed") &&
        typeof parsed.width === "number"
      ) {
        return { mode: parsed.mode, width: parsed.width }
      }
    }
  } catch {}
  return { mode: "expanded", width: SIDEBAR_WIDTH_DEFAULT }
}

function saveState(s: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {}
}

export function useSidebarState() {
  const [state, setState] = useState<PersistedState>(loadState)

  const collapse = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, mode: "collapsed" as SidebarMode }
      saveState(next)
      return next
    })
  }, [])

  const expand = useCallback(() => {
    setState(() => {
      const next: PersistedState = { mode: "expanded", width: SIDEBAR_WIDTH_DEFAULT }
      saveState(next)
      return next
    })
  }, [])

  const setExpandedWidth = useCallback((width: number) => {
    const clamped = Math.max(SIDEBAR_WIDTH_MIN, Math.min(SIDEBAR_WIDTH_MAX, width))
    setState(() => {
      const next: PersistedState = { mode: "expanded", width: clamped }
      saveState(next)
      return next
    })
  }, [])

  return {
    isCollapsed: state.mode === "collapsed",
    expandedWidth: state.width,
    collapse,
    expand,
    setExpandedWidth,
  }
}
