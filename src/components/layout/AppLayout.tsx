import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import { PageHeader } from "./PageHeader"
import { useSidebarState } from "@/hooks/useSidebarState"
import { SURFACE_HEADER_HEIGHT } from "@/config/layout"
import { cn } from "@/lib/utils"

type AppLayoutProps = {
  children: ReactNode
  pageTitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  sidebarView?: "org" | "cluster"
  activeHref?: string
}

export function AppLayout({
  children,
  pageTitle,
  breadcrumbs,
  sidebarView = "cluster",
  activeHref = "/cluster/dashboard",
}: AppLayoutProps) {
  const { isCollapsed, expandedWidth, collapse, expand, setExpandedWidth } =
    useSidebarState()

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
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-paper">
          {/* Page header zone with expand trigger when collapsed */}
          <div className="relative shrink-0">
            <PageHeader title={pageTitle} breadcrumbs={breadcrumbs} />
            {isCollapsed && (
              <button
                onClick={expand}
                aria-label="Expand sidebar"
                className={cn(
                  SURFACE_HEADER_HEIGHT,
                  "absolute left-0 inset-y-0 w-7 flex items-center justify-center",
                  "text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors"
                )}
              >
                <ChevronRight size={13} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
