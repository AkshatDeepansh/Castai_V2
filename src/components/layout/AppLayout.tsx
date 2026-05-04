import { useEffect, type ReactNode } from "react"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import { PageHeader } from "./PageHeader"
import { SidebarProvider, useSidebar } from "@/hooks/useSidebarContext"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

type AppLayoutProps = {
  children: ReactNode
  pageTitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  sidebarView?: "org" | "cluster"
  activeHref?: string
  pageActions?: ReactNode
  hideHeader?: boolean
}

function AppLayoutInner({
  children,
  pageTitle,
  breadcrumbs,
  sidebarView = "cluster",
  activeHref = "/cluster/dashboard",
  pageActions,
  hideHeader = false,
}: AppLayoutProps) {
  const { isCollapsed, expandedWidth, collapse, expand, setExpandedWidth } = useSidebar()
  const toggleSidebar = isCollapsed ? expand : collapse
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null
      if (!active) return

      const row = active.closest<HTMLTableRowElement>("tr[tabindex]")
      if (!row) return

      const tbody = row.closest("tbody")
      if (!tbody) return

      const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr[tabindex]"))
      const idx = rows.indexOf(row)
      if (idx === -1) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          rows[idx + 1]?.focus()
          break
        case "ArrowUp":
          e.preventDefault()
          rows[idx - 1]?.focus()
          break
        case "Home":
          e.preventDefault()
          rows[0]?.focus()
          break
        case "End":
          e.preventDefault()
          rows[rows.length - 1]?.focus()
          break
        case "Enter":
          if (active.tagName === "TR") {
            e.preventDefault()
            row.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')?.click()
          }
          break
        case "Escape":
          if (active.tagName === "TR") {
            e.preventDefault()
            active.blur()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <AppHeader />
      <div className="mx-3 mb-3 mt-2 flex-1 flex overflow-hidden bg-surface-paper rounded-2xl border border-border">
        <AppSidebar
          view={sidebarView}
          activeHref={activeHref}
          isCollapsed={isCollapsed}
          expandedWidth={expandedWidth}
          onCollapse={collapse}
          onResizeEnd={setExpandedWidth}
        />
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-surface-paper relative">
          {!hideHeader && (
            <div className="relative shrink-0">
              <PageHeader title={pageTitle} breadcrumbs={breadcrumbs} actions={pageActions} onSidebarToggle={toggleSidebar} />
            </div>
          )}
          <div className={cn("flex-1 min-w-0", hideHeader ? "flex flex-col overflow-hidden" : "overflow-auto p-4")}>
            {children}
          </div>
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  )
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutInner {...props} />
    </SidebarProvider>
  )
}
