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
  bottomBanner?: ReactNode
}

function AppLayoutInner({
  children,
  pageTitle,
  breadcrumbs,
  sidebarView = "cluster",
  activeHref = "/cluster/dashboard",
  pageActions,
  hideHeader = false,
  bottomBanner,
}: AppLayoutProps) {
  const hasBanner = !!bottomBanner
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
    <div className={cn("min-h-screen bg-background flex flex-col text-foreground", hasBanner && "pb-10")}>
      <AppHeader />
      <div className={cn(
        "mx-3 mt-2 flex-1 flex overflow-hidden bg-surface-paper border border-border transition-all duration-200",
        hasBanner ? "mb-0 rounded-tl-2xl rounded-tr-2xl rounded-bl-none rounded-br-none" : "mb-3 rounded-2xl"
      )}>
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
      {hasBanner && (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-surface-card border-t border-border z-40 flex items-center">
          {bottomBanner}
        </div>
      )}
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
