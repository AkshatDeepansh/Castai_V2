import { useState } from "react"
import {
  Star,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  HardDrive,
  MapPin,
  Zap,
  MoveHorizontal,
} from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// --- Types ---

type ResOffering = "SPOT" | "ON-DEMAND" | "ALL OFFERINGS"

type NodeTemplate = {
  id: string
  name: string
  nodeConfig: string
  offering: ResOffering
  nodes: number
  cpuEfficiency: number
  memEfficiency: number
  enabled: boolean
  isDefault: boolean
}

// --- Mock data ---

const INITIAL_TEMPLATES: NodeTemplate[] = [
  {
    id: "1",
    name: "default-by-castai",
    nodeConfig: "default",
    offering: "SPOT",
    nodes: 24,
    cpuEfficiency: 71,
    memEfficiency: 58,
    enabled: true,
    isDefault: true,
  },
  {
    id: "2",
    name: "prod-spot-amd64",
    nodeConfig: "prod-cpu-optimized",
    offering: "SPOT",
    nodes: 12,
    cpuEfficiency: 84,
    memEfficiency: 76,
    enabled: true,
    isDefault: false,
  },
  {
    id: "3",
    name: "prod-on-demand-xl",
    nodeConfig: "prod-memory-optimized",
    offering: "ON-DEMAND",
    nodes: 4,
    cpuEfficiency: 62,
    memEfficiency: 89,
    enabled: true,
    isDefault: false,
  },
  {
    id: "4",
    name: "gpu-inference-nodes",
    nodeConfig: "gpu-a100-large",
    offering: "ON-DEMAND",
    nodes: 2,
    cpuEfficiency: 91,
    memEfficiency: 67,
    enabled: false,
    isDefault: false,
  },
  {
    id: "5",
    name: "edge-all-offerings",
    nodeConfig: "edge-standard",
    offering: "ALL OFFERINGS",
    nodes: 6,
    cpuEfficiency: 55,
    memEfficiency: 48,
    enabled: true,
    isDefault: false,
  },
]

const PAGE_TABS = [
  { label: "Policies", active: false },
  { label: "Node templates", active: true },
  { label: "Node configurations", active: false },
  { label: "Edge location", active: false },
]

const FEATURES = [
  { label: "Storage autoscaling", icon: HardDrive, enabled: 2 },
  { label: "Edge location", icon: MapPin, enabled: 1 },
  { label: "GPU sharing", icon: Zap, enabled: 0 },
  { label: "Live migration", icon: MoveHorizontal, enabled: 3 },
]

// --- Sub-components ---

function TemplateToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        disabled ? "cursor-default" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-3" : "translate-x-0"
        )}
      />
    </button>
  )
}

function MiniBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1 w-14 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs tabular-nums w-7 text-right">{value}%</span>
    </div>
  )
}

function OfferingBadge({ offering }: { offering: ResOffering }) {
  const style: Record<ResOffering, string> = {
    SPOT: "bg-primary/10 text-primary border-primary/20",
    "ON-DEMAND":
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
    "ALL OFFERINGS":
      "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400 dark:border-violet-500/30",
  }
  return (
    <Badge
      variant="outline"
      className={cn("text-[0.6rem] px-1.5 uppercase tracking-wide border", style[offering])}
    >
      {offering}
    </Badge>
  )
}

const CIRC = 2 * Math.PI * 30

function DonutChart({ templates }: { templates: NodeTemplate[] }) {
  const total = templates.length
  const spot = templates.filter((t) => t.offering === "SPOT").length
  const onDemand = templates.filter((t) => t.offering === "ON-DEMAND").length
  const all = templates.filter((t) => t.offering === "ALL OFFERINGS").length

  const spotLen = (spot / total) * CIRC
  const onDemandLen = (onDemand / total) * CIRC
  const allLen = (all / total) * CIRC
  const gap = 3

  function segment(len: number, offset: number, color: string) {
    if (len <= 0) return null
    const actual = Math.max(0, len - gap)
    return (
      <circle
        cx={40}
        cy={40}
        r={30}
        fill="none"
        strokeWidth={7}
        style={{ stroke: color }}
        strokeDasharray={`${actual} ${CIRC - actual}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
      />
    )
  }

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
        {segment(spotLen, 0, "var(--primary)")}
        {segment(onDemandLen, spotLen, "var(--chart-4)")}
        {segment(allLen, spotLen + onDemandLen, "var(--chart-2)")}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold tabular-nums">{total}</span>
      </div>
    </div>
  )
}

// --- Page ---

export function Configurations() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [search, setSearch] = useState("")
  const total = templates.length

  function toggleEnabled(id: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    )
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.nodeConfig.toLowerCase().includes(search.toLowerCase())
  )

  const spotCount = templates.filter((t) => t.offering === "SPOT").length
  const onDemandCount = templates.filter((t) => t.offering === "ON-DEMAND").length
  const allCount = templates.filter((t) => t.offering === "ALL OFFERINGS").length

  const legendColor: Record<ResOffering, string> = {
    SPOT: "var(--primary)",
    "ON-DEMAND": "var(--chart-4)",
    "ALL OFFERINGS": "var(--chart-2)",
  }

  return (
    <AppLayout
      pageTitle="Configurations"
      breadcrumbs={[
        { label: "Acme Corp", href: "/overview" },
        { label: "Staging", href: "/cluster/dashboard" },
        { label: "Node Autoscaling", href: "/cluster/node-autoscaling" },
        { label: "Configurations" },
      ]}
      activeHref="/cluster/node-autoscaling/configurations"
    >
      {/* Page-level tabs */}
      <div className="-mx-4 -mt-4 mb-5 flex border-b border-border px-4">
        {PAGE_TABS.map((tab) => (
          <button
            key={tab.label}
            className={cn(
              "px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab.active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section subtitle + CTAs */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">Node templates</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Provision test
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs hover:bg-primary/90 transition-colors"
          >
            Create template
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Templates breakdown */}
        <Card className="py-0 gap-0">
          <CardContent className="p-4 flex items-center gap-5">
            <DonutChart templates={templates} />
            <div className="flex-1 min-w-0">
              <p className="text-[0.6875rem] text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                Templates by offering
              </p>
              {(
                [
                  ["SPOT", spotCount],
                  ["ON-DEMAND", onDemandCount],
                  ["ALL OFFERINGS", allCount],
                ] as [ResOffering, number][]
              ).map(([offering, count]) => (
                <div key={offering} className="flex items-center justify-between mb-2 last:mb-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: legendColor[offering] }}
                    />
                    <span className="text-xs text-muted-foreground">{offering}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features enabled */}
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <p className="text-[0.6875rem] text-muted-foreground mb-3 uppercase tracking-wide font-medium">
              Features enabled
            </p>
            <div className="space-y-2">
              {FEATURES.map((feat) => {
                const Icon = feat.icon
                return (
                  <div key={feat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className="text-muted-foreground shrink-0" />
                      <span className="text-xs">{feat.label}</span>
                    </div>
                    <span className="text-xs tabular-nums">
                      <span
                        className={
                          feat.enabled > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        }
                      >
                        {feat.enabled}
                      </span>
                      <span className="text-muted-foreground">/{total}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          placeholder="Search templates..."
          className="pl-9 h-8 text-xs bg-surface-paper border-border dark:border-border-subtle focus-visible:bg-card rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden ring-1 ring-border-subtle">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem]">
                Template name
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem]">
                Node configuration
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[130px]">
                Res. offering
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[72px]">
                Nodes
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[130px]">
                CPU eff.
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[130px]">
                Mem eff.
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                tabIndex={0}
                className={cn(
                  "border-b border-border/50 last:border-0 transition-colors hover:bg-muted/25",
                  !t.enabled && "opacity-50"
                )}
              >
                {/* Template name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <TemplateToggle
                      checked={t.enabled}
                      onChange={() => toggleEnabled(t.id)}
                      disabled={t.isDefault}
                    />
                    {t.isDefault ? (
                      <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" />
                    ) : (
                      <span className="w-3 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "font-medium truncate max-w-[180px]",
                        !t.enabled && "text-muted-foreground"
                      )}
                    >
                      {t.name}
                    </span>
                  </div>
                </td>

                {/* Node config */}
                <td className="px-4 py-3 text-muted-foreground">{t.nodeConfig}</td>

                {/* Offering */}
                <td className="px-4 py-3">
                  <OfferingBadge offering={t.offering} />
                </td>

                {/* Nodes */}
                <td className="px-4 py-3 tabular-nums">{t.nodes}</td>

                {/* CPU efficiency */}
                <td className="px-4 py-3">
                  <MiniBar value={t.cpuEfficiency} />
                </td>

                {/* Memory efficiency */}
                <td className="px-4 py-3">
                  <MiniBar value={t.memEfficiency} />
                </td>

                {/* Actions */}
                <td className="px-2 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal size={14} />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs gap-2">
                        <Pencil size={12} /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2">
                        <Copy size={12} /> Duplicate
                      </DropdownMenuItem>
                      {!t.isDefault && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs gap-2 text-destructive focus:text-destructive"
                            onClick={() => deleteTemplate(t.id)}
                          >
                            <Trash2 size={12} /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  No templates match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
