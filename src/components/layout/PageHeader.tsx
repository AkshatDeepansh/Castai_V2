import type { ReactNode } from "react"
import { PanelLeft } from "lucide-react"
import { IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { SURFACE_HEADER_HEIGHT } from "@/config/layout"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/hooks/useSidebarContext"

type Crumb = {
  label: string
  href?: string
}

type PageHeaderProps = {
  title?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  onSidebarToggle?: () => void
}

const defaultBreadcrumbs: Crumb[] = [
  { label: "Acme Corp", href: "/overview" },
  { label: "Staging", href: "/cluster/dashboard" },
  { label: "Dashboard" },
]

export function PageHeader({
  title = "Dashboard",
  breadcrumbs = defaultBreadcrumbs,
  actions,
  onSidebarToggle,
}: PageHeaderProps) {
  const { isCollapsed, expand, collapse } = useSidebar()
  const toggleSidebar = onSidebarToggle ?? (isCollapsed ? expand : collapse)

  return (
    <div className={cn(SURFACE_HEADER_HEIGHT, "px-4 pt-3 pb-3 border-b border-border shrink-0 flex flex-col justify-center bg-surface-paper")}>
      <nav aria-label="Breadcrumb" className="mb-1.5">
        <ol className="flex items-center gap-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="h-5 w-5 text-muted-foreground"
            >
              <PanelLeft size={13} />
            </Button>
            <div className="h-3.5 w-px bg-border mx-0.5 shrink-0" />
          </li>
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <IconChevronRight size={11} className="opacity-40 shrink-0" aria-hidden />
                )}
                {crumb.href && !isLast ? (
                  <a
                    href={crumb.href}
                    className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    className={isLast ? "text-foreground font-medium" : ""}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
