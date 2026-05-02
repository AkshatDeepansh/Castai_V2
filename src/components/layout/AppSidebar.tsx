import { useState, useRef, useCallback, useEffect } from "react"
import {
  Home,
  Database,
  Zap,
  CreditCard,
  BarChart2,
  ScrollText,
  LayoutDashboard,
  AlertTriangle,
  SlidersHorizontal,
  Layers,
  Server,
  LayoutGrid,
  SlidersVertical,
  History,
  FileText,
  ShieldCheck,
  PiggyBank,
  CloudCog,
  Cpu,
  Package,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Network,
  Check,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { orgNavigation, clusterNavigation, type NavEntry } from "@/config/navigation"
import { SURFACE_HEADER_HEIGHT } from "@/config/layout"
import {
  SIDEBAR_WIDTH_MIN,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_COLLAPSE_THRESHOLD,
  SIDEBAR_WIDTH_DEFAULT,
} from "@/hooks/useSidebarState"

const iconMap: Record<string, LucideIcon> = {
  IconHome: Home,
  IconDatabase: Database,
  IconBolt: Zap,
  IconCreditCard: CreditCard,
  IconChartBar: BarChart2,
  IconListDetails: ScrollText,
  IconLayoutDashboard: LayoutDashboard,
  IconAlertTriangle: AlertTriangle,
  IconAdjustmentsHorizontal: SlidersHorizontal,
  IconStack: Layers,
  IconServer: Server,
  IconLayoutGrid: LayoutGrid,
  IconAdjustments: SlidersVertical,
  IconHistory: History,
  IconTemplate: FileText,
  IconShieldCheck: ShieldCheck,
  IconPigMoney: PiggyBank,
  IconCloudComputing: CloudCog,
  IconCpu: Cpu,
  IconPackages: Package,
  IconArrowLeft: ArrowLeft,
  IconAdjustmentsAlt: SlidersHorizontal,
  IconRefresh: BarChart2,
  IconTrash: BarChart2,
  IconClipboardList: ScrollText,
  IconReportAnalytics: BarChart2,
}

function resolveIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard
}

const CLUSTERS = [
  { id: "staging", name: "Staging" },
  { id: "production", name: "Production" },
  { id: "dev", name: "Dev" },
]

type SidebarView = "org" | "cluster"

type NavLinkItemProps = {
  href: string
  icon?: string
  label: string
  active?: boolean
  isCollapsed: boolean
  className?: string
}

function NavLinkItem({ href, icon, label, active, isCollapsed, className }: NavLinkItemProps) {
  const Icon = icon ? resolveIcon(icon) : null
  const link = (
    <a
      href={href}
      className={cn(
        "relative w-full flex items-center rounded-md py-1.5 text-sm transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isCollapsed ? "justify-center px-1.5 gap-0" : cn("px-2.5", Icon && "gap-2.5"),
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        className
      )}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute left-0 top-[15%] h-[70%] w-0.5 rounded-full bg-primary" />
      )}
      {Icon && <Icon size={16} className="shrink-0" />}
      <span
        className={cn(
          "truncate transition-opacity duration-150",
          isCollapsed ? "w-0 overflow-hidden opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {label}
      </span>
    </a>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    )
  }
  return link
}

type NavGroupItemProps = {
  label: string
  icon: string
  children: Array<{ label: string; href: string; icon?: string }>
  activeHref: string
  defaultOpen?: boolean
  isCollapsed: boolean
}

function NavGroupItem({ label, icon, children, activeHref, defaultOpen, isCollapsed }: NavGroupItemProps) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const childrenRef = useRef<HTMLDivElement>(null)
  const focusFirstChildRef = useRef(false)
  const Icon = resolveIcon(icon)
  const hasActive = children.some((c) => c.href === activeHref)

  useEffect(() => {
    if (open && focusFirstChildRef.current) {
      focusFirstChildRef.current = false
      childrenRef.current?.querySelector<HTMLElement>("a, button")?.focus()
    }
  }, [open])

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative w-full flex items-center justify-center rounded-md py-1.5 px-1.5",
              hasActive ? "text-sidebar-foreground" : "text-sidebar-foreground/60"
            )}
          >
            {hasActive && (
              <span className="absolute left-0 top-[15%] h-[70%] w-0.5 rounded-full bg-primary" />
            )}
            <Icon size={16} className="shrink-0" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !open) {
            focusFirstChildRef.current = true
          }
        }}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          hasActive
            ? "text-sidebar-foreground font-medium"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
        )}
        aria-expanded={open}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 truncate text-left">{label}</span>
        {open ? (
          <ChevronDown size={13} className="opacity-50" />
        ) : (
          <ChevronRight size={13} className="opacity-50" />
        )}
      </button>
      {open && (
        <div
          ref={childrenRef}
          className="mt-0.5 ml-4 pl-3 border-l border-border/50 space-y-0.5"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation()
              setOpen(false)
              buttonRef.current?.focus()
            }
          }}
        >
          {children.map((child) => (
            <NavLinkItem
              key={child.href}
              href={child.href}
              icon={child.icon}
              label={child.label}
              active={child.href === activeHref}
              isCollapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function handleNavKeyDown(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return

  const nav = e.currentTarget
  const items = Array.from(
    nav.querySelectorAll<HTMLElement>("a[href], button[aria-expanded]")
  )
  if (items.length === 0) return

  const idx = items.indexOf(document.activeElement as HTMLElement)
  if (idx === -1) return

  e.preventDefault()

  if (e.key === "ArrowDown") {
    items[idx + 1]?.focus()
  } else {
    items[idx - 1]?.focus()
  }
}

function renderNavEntries(entries: NavEntry[], activeHref: string, isCollapsed: boolean) {
  return entries
    .filter((e) => e.type !== "back")
    .map((entry, i) => {
      if (entry.type === "link") {
        return (
          <NavLinkItem
            key={i}
            href={entry.href}
            icon={entry.icon}
            label={entry.label}
            active={entry.href === activeHref}
            isCollapsed={isCollapsed}
          />
        )
      }
      if (entry.type === "group") {
        const hasActive = entry.children.some((c) => c.href === activeHref)
        return (
          <NavGroupItem
            key={i}
            label={entry.label}
            icon={entry.icon}
            children={entry.children}
            activeHref={activeHref}
            defaultOpen={hasActive}
            isCollapsed={isCollapsed}
          />
        )
      }
      return null
    })
}

type AppSidebarProps = {
  view?: SidebarView
  activeHref?: string
  isCollapsed: boolean
  expandedWidth: number
  onCollapse: () => void
  onResizeEnd: (width: number) => void
}

export function AppSidebar({
  view = "cluster",
  activeHref = "/cluster/dashboard",
  isCollapsed,
  expandedWidth,
  onCollapse,
  onResizeEnd,
}: AppSidebarProps) {
  const [activeCluster, setActiveCluster] = useState(CLUSTERS[0])
  const sidebarRef = useRef<HTMLElement>(null)
  const navEntries = view === "org" ? orgNavigation : clusterNavigation
  const backEntry = clusterNavigation.find((e) => e.type === "back")
  const currentWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : expandedWidth

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : expandedWidth
      let dragWidth = startWidth

      const node = sidebarRef.current
      if (node) node.style.transition = "none"
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      function onMouseMove(e: MouseEvent) {
        dragWidth = Math.max(
          SIDEBAR_WIDTH_COLLAPSED,
          Math.min(SIDEBAR_WIDTH_MAX, startWidth + e.clientX - startX)
        )
        if (node) node.style.width = `${dragWidth}px`
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        // Re-enable CSS transition, force reflow so animation fires
        if (node) {
          node.style.transition = ""
          void node.offsetWidth
        }

        if (isCollapsed) {
          // Dragging out from collapsed state
          if (dragWidth >= SIDEBAR_COLLAPSE_THRESHOLD) {
            // Always snap to default width, not the dragged position
            onResizeEnd(SIDEBAR_WIDTH_DEFAULT)
          } else {
            // Snap back to collapsed — animate back to collapsed width
            if (node) node.style.width = `${SIDEBAR_WIDTH_COLLAPSED}px`
          }
        } else {
          // Dragging from expanded state
          if (dragWidth < SIDEBAR_COLLAPSE_THRESHOLD) {
            // Auto-collapse — animate to collapsed width then commit
            if (node) node.style.width = `${SIDEBAR_WIDTH_COLLAPSED}px`
            onCollapse()
          } else {
            onResizeEnd(Math.max(SIDEBAR_WIDTH_MIN, dragWidth))
          }
        }
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [isCollapsed, expandedWidth, onCollapse, onResizeEnd]
  )

  return (
    <TooltipProvider delayDuration={400}>
      <aside
        ref={sidebarRef}
        className="group/sidebar relative shrink-0 flex flex-col border-r border-border bg-surface-paper transition-[width] duration-200 ease-in-out"
        style={{ width: currentWidth }}
      >
        {/* Scrollable inner content */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0">
          {view === "cluster" && (
            <div
              className={cn(
                SURFACE_HEADER_HEIGHT,
                "border-b border-border shrink-0 flex flex-col justify-center gap-2 overflow-hidden",
                isCollapsed ? "px-1.5" : "px-3"
              )}
            >
              {/* Back to organization */}
              {backEntry && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={backEntry.href}
                      className={cn(
                        "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <ArrowLeft size={12} className="shrink-0" />
                      <span
                        className={cn(
                          "whitespace-nowrap overflow-hidden transition-opacity duration-150",
                          isCollapsed ? "w-0 opacity-0" : "opacity-100"
                        )}
                      >
                        {backEntry.label}
                      </span>
                    </a>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={8}>
                      {backEntry.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )}

              {/* Cluster selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent",
                      isCollapsed
                        ? "w-8 justify-center p-0 gap-0"
                        : "w-full justify-start gap-2 px-2"
                    )}
                    aria-label="Switch cluster"
                  >
                    <Network size={13} className="shrink-0 text-muted-foreground" />
                    {/* flex-1 only when expanded so icon stays centered when collapsed */}
                    <span
                      className={cn(
                        "text-left truncate transition-opacity duration-150",
                        isCollapsed
                          ? "w-0 overflow-hidden opacity-0"
                          : "flex-1 opacity-100"
                      )}
                    >
                      {activeCluster.name}
                    </span>
                    {!isCollapsed && (
                      <ChevronDown size={12} className="opacity-50 shrink-0" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                    Clusters
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {CLUSTERS.map((cluster) => (
                    <DropdownMenuItem
                      key={cluster.id}
                      onClick={() => setActiveCluster(cluster)}
                      className="text-sm gap-2"
                    >
                      <span className="flex-1">{cluster.name}</span>
                      {activeCluster.id === cluster.id && (
                        <Check size={13} className="text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Nav entries */}
          <nav
            className="flex-1 px-2 pt-3 pb-2 space-y-0.5"
            aria-label="Sidebar navigation"
            onKeyDown={handleNavKeyDown}
          >
            {renderNavEntries(navEntries, activeHref, isCollapsed)}
          </nav>
        </div>

        {/* Drag-to-resize / drag-to-collapse handle — shown on hover of sidebar edge in both states */}
        <div
          className="absolute inset-y-0 -right-2 w-4 flex items-center justify-center cursor-col-resize z-10 group/handle"
          onMouseDown={handleDragStart}
        >
          <div className="w-px h-10 rounded-full bg-border opacity-0 group-hover/handle:opacity-100 transition-opacity duration-150" />
        </div>
      </aside>
    </TooltipProvider>
  )
}
