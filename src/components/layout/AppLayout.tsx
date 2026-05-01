import type { ReactNode } from "react"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import { PageHeader } from "./PageHeader"

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
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <AppHeader />
      <div className="mx-4 mb-4 flex-1 flex overflow-hidden bg-surface-paper rounded-2xl border border-border">
        <AppSidebar view={sidebarView} activeHref={activeHref} />
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-paper">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <PageHeader title={pageTitle} breadcrumbs={breadcrumbs} />
          </div>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
