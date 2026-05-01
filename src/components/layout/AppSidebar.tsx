import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { orgNavigation, clusterNavigation, type NavEntry } from "@/config/navigation"

const iconMap: Record<string, LucideIcon> = {
  // Org nav
  IconHome: Home,
  IconDatabase: Database,
  IconBolt: Zap,
  IconCreditCard: CreditCard,
  IconChartBar: BarChart2,
  IconListDetails: ScrollText,
  // Cluster nav
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
  // Shared / misc
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
  icon: string
  label: string
  active?: boolean
  className?: string
}

function NavLinkItem({ href, icon, label, active, className }: NavLinkItemProps) {
  const Icon = resolveIcon(icon)
  return (
    <a
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
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
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  )
}

type NavGroupItemProps = {
  label: string
  icon: string
  children: Array<{ label: string; href: string; icon: string }>
  activeHref: string
  defaultOpen?: boolean
}

function NavGroupItem({ label, icon, children, activeHref, defaultOpen }: NavGroupItemProps) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const Icon = resolveIcon(icon)
  const hasActive = children.some((c) => c.href === activeHref)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
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
        <div className="mt-0.5 ml-4 pl-3 border-l border-border/50 space-y-0.5">
          {children.map((child) => (
            <NavLinkItem
              key={child.href}
              href={child.href}
              icon={child.icon}
              label={child.label}
              active={child.href === activeHref}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function renderNavEntries(entries: NavEntry[], activeHref: string) {
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
          />
        )
      }
      return null
    })
}

type AppSidebarProps = {
  view?: SidebarView
  activeHref?: string
}

export function AppSidebar({ view = "cluster", activeHref = "/cluster/dashboard" }: AppSidebarProps) {
  const [activeCluster, setActiveCluster] = useState(CLUSTERS[0])
  const navEntries = view === "org" ? orgNavigation : clusterNavigation
  const backEntry = clusterNavigation.find((e) => e.type === "back")

  return (
    <aside className="w-52 shrink-0 flex flex-col border-r border-border bg-surface-paper overflow-y-auto">
      {view === "cluster" && (
        <div className="border-b border-border/60">
          {/* Back to organization */}
          {backEntry && (
            <div className="px-3 pt-2.5 pb-1.5">
              <a
                href={backEntry.href}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <ArrowLeft size={12} className="shrink-0" />
                <span>{backEntry.label}</span>
              </a>
            </div>
          )}

          {/* Cluster selector */}
          <div className="px-3 pb-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 justify-start gap-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent px-2"
                  aria-label="Switch cluster"
                >
                  <Network size={13} className="shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">{activeCluster.name}</span>
                  <ChevronDown size={12} className="opacity-50" />
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
        </div>
      )}

      {/* Nav entries */}
      <nav className="flex-1 px-2 py-2 space-y-0.5" aria-label="Sidebar navigation">
        {renderNavEntries(navEntries, activeHref)}
      </nav>
    </aside>
  )
}
