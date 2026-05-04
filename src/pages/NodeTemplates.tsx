import { useState, useRef, useCallback, useEffect } from "react"
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
  Check,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
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

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowMode = "list" | "scenario" | "step1" | "step2" | "step3" | "edit"
export type ResOffering = "SPOT" | "ON-DEMAND" | "ALL OFFERINGS"

export type NodeTemplate = {
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

type TemplateForm = {
  name: string
  nodeConfig: string
  taintEnabled: boolean
  taints: Array<{ key: string; value: string; effect: string }>
  customLabels: boolean
  labels: Array<{ key: string; value: string }>
  archX86: boolean
  archArm: boolean
  osLinux: boolean
  osWindows: boolean
  offeringSpot: boolean
  offeringOnDemand: boolean
  criteria: Record<string, string>
  cpuLimitEnabled: boolean
  spotFallback: boolean
  spotFallbackDelay: string
  interruptionPrediction: boolean
  diversifySpot: boolean
  reliableSpot: boolean
  gpuSharing: boolean
  standbyPool: boolean
  liveMigration: boolean
  storageAutoscaler: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: TemplateForm = {
  name: "",
  nodeConfig: "Default",
  taintEnabled: false,
  taints: [{ key: "scheduling.cast.ai/node-template", value: "", effect: "NoSchedule" }],
  customLabels: false,
  labels: [{ key: "", value: "" }],
  archX86: true,
  archArm: false,
  osLinux: true,
  osWindows: false,
  offeringSpot: true,
  offeringOnDemand: false,
  criteria: {},
  cpuLimitEnabled: false,
  spotFallback: false,
  spotFallbackDelay: "5 min",
  interruptionPrediction: false,
  diversifySpot: false,
  reliableSpot: false,
  gpuSharing: false,
  standbyPool: false,
  liveMigration: false,
  storageAutoscaler: false,
}

const PRESET_OVERRIDES: Record<string, Partial<TemplateForm>> = {
  "cost-optimized": {
    offeringSpot: true, offeringOnDemand: false,
    spotFallback: true, interruptionPrediction: true,
    criteria: { minCpu: "2", maxCpu: "32" },
  },
  "stable-production": {
    offeringSpot: false, offeringOnDemand: true,
    taintEnabled: true,
  },
  "gpu-workloads": {
    criteria: { gpuManufacturer: "NVIDIA", minGpu: "1" },
    gpuSharing: true, diversifySpot: true,
  },
  "windows-fleet": {
    osLinux: false, osWindows: true,
    offeringSpot: false, offeringOnDemand: true,
  },
  "burstable-dev": {
    offeringSpot: true,
    criteria: { minCpu: "1", maxCpu: "8" },
  },
}

const PRESETS = [
  { id: "cost-optimized", emoji: "💰", title: "Cost-optimized", desc: "Spot + fallback + ML prediction. Linux, x86_64.", tag: "most popular" },
  { id: "stable-production", emoji: "🧊", title: "Stable production", desc: "On-demand only. Tainted. No spot interruptions." },
  { id: "gpu-workloads", emoji: "🎮", title: "GPU workloads", desc: "NVIDIA GPU, Spot, diversified across families." },
  { id: "windows-fleet", emoji: "🪟", title: "Windows fleet", desc: "Windows OS, on-demand." },
  { id: "burstable-dev", emoji: "⚡", title: "Burstable dev", desc: "Burstable, small CPU range, spot." },
]

type ConstraintType = "boolean" | "number" | "select" | "multiselect"
type ConstraintDef = {
  key: string; label: string; type: ConstraintType
  options?: string[]; unit?: string; placeholder?: string
}

const INSTANCE_FAMILIES = ["a1","c4","c5","c5a","c5n","c6a","c6g","c6i","c7g","c7i","d3","g4dn","g5","i3","i4i","m4","m5","m5a","m6a","m6g","m6i","m7g","m7i","p3","p4d","p5","r5","r5a","r6a","r6g","r6i","r7g","r7i","t3","t3a","t4g","x2idn","z1d"]
const GPU_NAMES = ["A100","A10G","H100","K80","L4","L40S","T4","V100"]

const CONSTRAINT_DEFS: ConstraintDef[] = [
  { key: "computeOptimized",  label: "Compute optimized",  type: "boolean" },
  { key: "storageOptimized",  label: "Storage optimized",  type: "boolean" },
  { key: "burstable",         label: "Burstable",          type: "boolean" },
  { key: "bareMetal",         label: "Bare metal",         type: "boolean" },
  { key: "fractionalGpus",    label: "Fractional GPUs",    type: "boolean" },
  { key: "includeFamilies",   label: "Include families",   type: "multiselect", options: INSTANCE_FAMILIES },
  { key: "excludeFamilies",   label: "Exclude families",   type: "multiselect", options: INSTANCE_FAMILIES },
  { key: "minCpu",            label: "Min CPU",            type: "number",  placeholder: "e.g. 4" },
  { key: "maxCpu",            label: "Max CPU",            type: "number",  placeholder: "e.g. 64" },
  { key: "minMemory",         label: "Min memory",         type: "number",  unit: "GiB", placeholder: "e.g. 16" },
  { key: "maxMemory",         label: "Max memory",         type: "number",  unit: "GiB", placeholder: "e.g. 256" },
  { key: "cpuVendor",         label: "CPU vendor",         type: "select",  options: ["AMD", "Intel", "AWS Graviton"] },
  { key: "availabilityZones", label: "Availability zones", type: "multiselect", options: ["us-east-1a","us-east-1b","us-east-1c","us-west-2a","us-west-2b","us-west-2c","eu-west-1a","eu-west-1b","eu-central-1a"] },
  { key: "gpuManufacturer",   label: "GPU manufacturer",   type: "select",  options: ["NVIDIA", "AMD", "Intel"] },
  { key: "includeGpuName",    label: "Include GPU name",   type: "multiselect", options: GPU_NAMES },
  { key: "excludeGpuName",    label: "Exclude GPU name",   type: "multiselect", options: GPU_NAMES },
  { key: "minGpu",            label: "Min GPU",            type: "number",  placeholder: "e.g. 1" },
  { key: "maxGpu",            label: "Max GPU",            type: "number",  placeholder: "e.g. 8" },
]

export const INITIAL_TEMPLATES: NodeTemplate[] = [
  { id: "1", name: "default-by-castai", nodeConfig: "default", offering: "SPOT", nodes: 24, cpuEfficiency: 71, memEfficiency: 58, enabled: true, isDefault: true },
  { id: "2", name: "prod-spot-amd64", nodeConfig: "prod-cpu-optimized", offering: "SPOT", nodes: 12, cpuEfficiency: 84, memEfficiency: 76, enabled: true, isDefault: false },
  { id: "3", name: "prod-on-demand-xl", nodeConfig: "prod-memory-optimized", offering: "ON-DEMAND", nodes: 4, cpuEfficiency: 62, memEfficiency: 89, enabled: true, isDefault: false },
  { id: "4", name: "gpu-inference-nodes", nodeConfig: "gpu-a100-large", offering: "ON-DEMAND", nodes: 2, cpuEfficiency: 91, memEfficiency: 67, enabled: false, isDefault: false },
  { id: "5", name: "edge-all-offerings", nodeConfig: "edge-standard", offering: "ALL OFFERINGS", nodes: 6, cpuEfficiency: 55, memEfficiency: 48, enabled: true, isDefault: false },
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

// ─── Utilities ────────────────────────────────────────────────────────────────

function computeApplicableInstances(form: TemplateForm): number {
  const n = Object.keys(form.criteria).length
  if (n === 0) return 126
  if (n <= 2) return 48
  if (n <= 4) return 12
  return Math.max(1, 9 - n)
}

function computeTightnessPercent(form: TemplateForm): number {
  const n = computeApplicableInstances(form)
  if (n >= 100) return 12
  if (n >= 40) return 35
  if (n >= 10) return 58
  if (n >= 5) return 78
  return 92
}

function templateToForm(t: NodeTemplate): TemplateForm {
  return {
    ...DEFAULT_FORM,
    name: t.name,
    nodeConfig: t.nodeConfig,
    taintEnabled: t.isDefault,
    taints: [{ key: "scheduling.cast.ai/node-template", value: t.name, effect: "NoSchedule" }],
    offeringSpot: t.offering === "SPOT" || t.offering === "ALL OFFERINGS",
    offeringOnDemand: t.offering === "ON-DEMAND" || t.offering === "ALL OFFERINGS",
  }
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function TemplateToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
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
      <span className={cn("pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200", checked ? "translate-x-3" : "translate-x-0")} />
    </button>
  )
}

function MiniBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1 w-14 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary/70" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums w-7 text-right">{value}%</span>
    </div>
  )
}

function OfferingBadge({ offering }: { offering: ResOffering }) {
  const style: Record<ResOffering, string> = {
    SPOT: "bg-primary/10 text-primary border-primary/20",
    "ON-DEMAND": "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
    "ALL OFFERINGS": "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400 dark:border-violet-500/30",
  }
  return (
    <Badge variant="outline" className={cn("text-[0.6rem] px-1.5 uppercase tracking-wide border", style[offering])}>
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
    return <circle cx={40} cy={40} r={30} fill="none" strokeWidth={7} style={{ stroke: color }} strokeDasharray={`${actual} ${CIRC - actual}`} strokeDashoffset={-offset} strokeLinecap="butt" />
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

// ─── Wizard shared primitives ──────────────────────────────────────────────────

function CheckField({ checked, onChange, label, description, disabled, suffix }: {
  checked: boolean; onChange: () => void; label: string; description?: string; disabled?: boolean; suffix?: React.ReactNode
}) {
  return (
    <label className={cn("flex items-center gap-2.5 cursor-pointer select-none", disabled && "opacity-50 pointer-events-none")}>
      <button
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "h-4 w-4 rounded border border-input flex items-center justify-center shrink-0 transition-colors",
          checked ? "bg-primary border-primary" : "bg-background"
        )}
      >
        {checked && <Check size={10} className="text-primary-foreground" />}
      </button>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{label}</span>
          {suffix}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

function FormSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="text-xs font-semibold text-foreground mb-3">{title}</div>
      {children}
    </div>
  )
}

const RAIL_MIN = 300
const RAIL_MAX = 640
const RAIL_DEFAULT = 440

function RightRail({ title, pill, children }: { title: string; pill?: string; children: React.ReactNode }) {
  const [width, setWidth] = useState(RAIL_DEFAULT)
  const railRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width
    const node = railRef.current
    if (node) node.style.transition = "none"
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    function onMouseMove(e: MouseEvent) {
      const next = Math.max(RAIL_MIN, Math.min(RAIL_MAX, startWidth - (e.clientX - startX)))
      if (node) node.style.width = `${next}px`
    }
    function onMouseUp(e: MouseEvent) {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      if (node) node.style.transition = ""
      const next = Math.max(RAIL_MIN, Math.min(RAIL_MAX, startWidth - (e.clientX - startX)))
      setWidth(next)
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [width])

  return (
    <div
      ref={railRef}
      className="relative shrink-0 border-l border-border bg-surface-paper overflow-y-auto transition-[width] duration-0"
      style={{ width }}
    >
      {/* Drag handle */}
      <div
        className="absolute inset-y-0 -left-2 w-4 flex items-center justify-center cursor-col-resize z-10 group/handle"
        onMouseDown={handleDragStart}
      >
        <div className="w-px h-10 rounded-full bg-border opacity-0 group-hover/handle:opacity-100 transition-opacity duration-150" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
          {pill && <Badge variant="outline" className="text-[0.6rem] px-1.5">{pill}</Badge>}
        </div>
        {children}
      </div>
    </div>
  )
}

function TightnessMeter({ percent }: { percent: number }) {
  const isTight = percent >= 80
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-foreground">Chances of fallback</div>
      <div className="relative h-2.5 rounded-full overflow-visible" style={{ background: "linear-gradient(90deg,#22c55e 0%,#eab308 50%,#ef4444 100%)" }}>
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground rounded-full shadow-sm" style={{ left: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-[0.65rem] text-muted-foreground">
        <span>loose · safer</span>
        <span className={isTight ? "text-destructive font-semibold" : ""}>tight · risky</span>
      </div>
    </div>
  )
}

const MOCK_INSTANCES = [
  { name: "c4-highcpu-16",  cost: "$0.05",  cpu: 16,  mem: "32 GiB",  gpu: 0, gpuType: "—"    },
  { name: "c4-highcpu-32",  cost: "$0.05",  cpu: 32,  mem: "64 GiB",  gpu: 0, gpuType: "—"    },
  { name: "m5.4xlarge",     cost: "$0.048", cpu: 16,  mem: "64 GiB",  gpu: 0, gpuType: "—"    },
  { name: "m5.8xlarge",     cost: "$0.048", cpu: 32,  mem: "128 GiB", gpu: 0, gpuType: "—"    },
  { name: "c5.2xlarge",     cost: "$0.042", cpu: 8,   mem: "16 GiB",  gpu: 0, gpuType: "—"    },
  { name: "c5.4xlarge",     cost: "$0.042", cpu: 16,  mem: "32 GiB",  gpu: 0, gpuType: "—"    },
  { name: "r5.2xlarge",     cost: "$0.063", cpu: 8,   mem: "64 GiB",  gpu: 0, gpuType: "—"    },
  { name: "g5.24xlarge",    cost: "$0.106", cpu: 96,  mem: "192 GiB", gpu: 4, gpuType: "A10G"  },
  { name: "p3.2xlarge",     cost: "$0.312", cpu: 8,   mem: "61 GiB",  gpu: 1, gpuType: "V100"  },
  { name: "t3.2xlarge",     cost: "$0.033", cpu: 8,   mem: "32 GiB",  gpu: 0, gpuType: "—"    },
]

function InstanceTable({ rows }: { rows: typeof MOCK_INSTANCES }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setW(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showCost    = w >= 200
  const showCpu     = w >= 240
  const showMem     = w >= 300
  const showGpu     = w >= 340
  const showGpuType = w >= 380

  const cols = ["1fr", showCost && "4rem", showCpu && "3rem", showMem && "5rem", showGpu && "3rem", showGpuType && "4rem"]
    .filter(Boolean).join(" ")

  const hd = "text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-wide text-right first:text-left"
  const td = "text-right tabular-nums text-muted-foreground first:text-left first:font-medium first:text-foreground first:truncate"

  return (
    <div ref={containerRef} className="mt-4 border-t border-border/50 pt-3">
      <div className="grid pb-1.5 border-b border-border/50" style={{ gridTemplateColumns: cols }}>
        <div className={hd}>Instance</div>
        {showCost    && <div className={hd} title="Cost per instance-hour">Cost/hr</div>}
        {showCpu     && <div className={hd}>CPU</div>}
        {showMem     && <div className={hd}>Mem</div>}
        {showGpu     && <div className={hd}>GPU</div>}
        {showGpuType && <div className={hd}>GPU Type</div>}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid text-xs py-1.5 border-b border-border/40 last:border-0" style={{ gridTemplateColumns: cols }}>
          <div className={td}>{row.name}</div>
          {showCost    && <div className={td}>{row.cost}</div>}
          {showCpu     && <div className={td}>{row.cpu}</div>}
          {showMem     && <div className={td}>{row.mem}</div>}
          {showGpu     && <div className={td}>{row.gpu || "—"}</div>}
          {showGpuType && <div className={td}>{row.gpuType}</div>}
        </div>
      ))}
    </div>
  )
}

function YamlPreview({ form }: { form: TemplateForm }) {
  const name = form.name || "<name>"
  const taintLines = form.taintEnabled && form.taints.length > 0
    ? form.taints.flatMap(t => [
        `  - key: "scheduling.cast.ai/node-template"`,
        `    value: "${t.value || name}"`,
        `    operator: "Equal"`,
        `    effect: "${t.effect}"`,
      ])
    : []
  const lines = [
    "# nodeSelector",
    `scheduling.cast.ai/node-template: ${name}`,
    ...(taintLines.length > 0 ? ["", "# tolerations", "tolerations:", ...taintLines] : []),
  ]
  return (
    <pre className="rounded-md bg-muted border border-border px-4 py-3 font-mono text-[11px] leading-relaxed overflow-x-auto">
      <code>
        {lines.map((l, i) => (
          <div key={i} className={cn("whitespace-pre", l.startsWith("#") ? "text-muted-foreground" : "text-foreground")}>
            {l || " "}
          </div>
        ))}
      </code>
    </pre>
  )
}

// ─── Feature row patterns ─────────────────────────────────────────────────────

function FeatureSimple({ title, desc, enabled, onChange, locked }: {
  title: string; desc: string; enabled: boolean; onChange: () => void; locked?: boolean; lockReason?: string
}) {
  return (
    <div className={cn("p-3 rounded-lg border border-border bg-card", locked && "opacity-55")}>
      <div className="flex items-start gap-3">
        <TemplateToggle checked={enabled} onChange={onChange} disabled={locked} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium leading-none">{title}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
      </div>
    </div>
  )
}

function FeatureInline({ title, desc, enabled, onChange, children }: {
  title: string; desc: string; enabled: boolean; onChange: () => void; children?: React.ReactNode
}) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card">
      <div className="flex items-start gap-3">
        <TemplateToggle checked={enabled} onChange={onChange} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium leading-none">{title}</span>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          {enabled && children && (
            <div className="mt-3 pt-3 border-t border-dashed border-border/60">{children}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeatureComplex({ title, desc, enabled, onChange, ctaLabel }: {
  title: string; desc: string; enabled: boolean; onChange: () => void; ctaLabel: string
}) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card">
      <div className="flex items-start gap-3">
        <TemplateToggle checked={enabled} onChange={onChange} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium leading-none">{title}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          {enabled && (
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs">{ctaLabel} →</Button>
              <span className="text-xs text-muted-foreground">not configured yet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Wizard header / stepper / footer ─────────────────────────────────────────

const FLOW_BREADCRUMBS_BASE = [
  { label: "Acme Corp", href: "/overview" },
  { label: "Staging", href: "/cluster/dashboard" },
  { label: "Node Autoscaling", href: "/cluster/node-autoscaling" },
  { label: "Configurations", href: "/cluster/node-autoscaling/configurations" },
]

function WizardHeader({ onCancel }: { onCancel: () => void }) {
  return (
    <PageHeader
      title="Create a new node template"
      breadcrumbs={[...FLOW_BREADCRUMBS_BASE, { label: "New template" }]}
      actions={<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>}
    />
  )
}

function WizardStepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1 as const, label: "Template setup" },
    { n: 2 as const, label: "Constraints" },
    { n: 3 as const, label: "Features" },
  ]
  const progressPercent = (step / steps.length) * 100
  return (
    <div className="border-b border-border/50 shrink-0 bg-surface-paper">
      <div className="flex items-center gap-10 px-6 pt-3 pb-3">
        {steps.map((s) => {
          const done = s.n < step
          const active = s.n === step
          return (
            <div key={s.n} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0",
                done ? "bg-foreground text-background" : active ? "bg-primary text-white" : "border border-border text-muted-foreground/50 bg-background"
              )}>
                {done ? <Check size={11} /> : s.n}
              </div>
              <span className={cn(
                "text-sm transition-colors",
                active ? "font-semibold text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/40"
              )}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
      {/* Progress bar — no horizontal padding so it bleeds edge-to-edge */}
      <div className="h-0.5 bg-border/40">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

function WizardFooter({ step, onBack, onContinue }: { step: 1 | 2 | 3; onBack: () => void; onContinue: () => void }) {
  return (
    <div className="flex items-center justify-between h-16 border-t border-border px-6 shrink-0 bg-surface-paper">
      <Button variant="ghost" onClick={onBack} disabled={step === 1} className="gap-1.5">
        <ArrowLeft size={13} /> Back
      </Button>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">auto-saved</span>
        <Button onClick={onContinue} className="h-8 text-sm">
          {step === 3 ? "Create template" : "Continue →"}
        </Button>
      </div>
    </div>
  )
}

// ─── Split input primitives ───────────────────────────────────────────────────

function SplitSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div className="flex items-center h-9 rounded-md border border-input overflow-hidden text-sm bg-transparent">
      <span className="px-3 text-xs text-muted-foreground whitespace-nowrap bg-muted/40 h-full flex items-center border-r border-input shrink-0 min-w-[5rem]">
        {label}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 px-3 bg-transparent outline-none text-sm text-foreground h-full cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── Repeatable field group ───────────────────────────────────────────────────

type FieldDef = {
  key: string
  label: string
  type?: "input" | "select"
  options?: string[]
  className?: string
}

function RepeatableFieldGroup({
  fields,
  rows,
  onChange,
  onRemove,
  onAdd,
  addLabel,
}: {
  fields: FieldDef[]
  rows: Record<string, string>[]
  onChange: (i: number, key: string, val: string) => void
  onRemove: (i: number) => void
  onAdd: () => void
  addLabel: string
}) {
  return (
    <div className="space-y-1.5">
      {/* Column headers */}
      <div className="flex items-center gap-2">
        {fields.map(f => (
          <div
            key={f.key}
            className={cn(
              "text-xs text-muted-foreground",
              f.className ?? "flex-1"
            )}
          >
            {f.label}
          </div>
        ))}
        <div className="w-5 shrink-0" />
      </div>
      {/* Data rows */}
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {fields.map(f =>
            f.type === "select" ? (
              <select
                key={f.key}
                value={row[f.key] ?? ""}
                onChange={e => onChange(i, f.key, e.target.value)}
                className={cn(
                  "h-9 rounded-md border border-input px-2.5 text-sm text-foreground outline-none cursor-pointer",
                  f.className ?? "flex-1"
                )}
              >
                {f.options?.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <Input
                key={f.key}
                value={row[f.key] ?? ""}
                onChange={e => onChange(i, f.key, e.target.value)}
                className={cn("h-9 text-sm", f.className ?? "flex-1")}
              />
            )
          )}
          <button
            onClick={() => onRemove(i)}
            className="shrink-0 w-5 flex justify-center text-muted-foreground/40 hover:text-destructive transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {/* Add row */}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
      >
        <Plus size={11} /> {addLabel}
      </button>
    </div>
  )
}

// ─── Constraint pill ─────────────────────────────────────────────────────────

function ConstraintPill({ def, value, onSet, onRemove }: {
  def: ConstraintDef
  value: string | undefined
  onSet: (val: string) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [popupDir, setPopupDir] = useState<"left" | "right">("left")
  const [draft, setDraft] = useState("")
  const [draftMulti, setDraftMulti] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)
  const isActive = value !== undefined

  function openPopup() {
    if (def.type === "boolean") { if (!isActive) onSet("true"); return }
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect()
      setPopupDir(rect.right + 224 > window.innerWidth ? "right" : "left")
    }
    if (def.type === "multiselect") setDraftMulti(value ? value.split(",") : [])
    else setDraft(value ?? "")
    setSearch("")
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  function applyNumber() {
    if (draft.trim()) { onSet(draft.trim()); setOpen(false) }
  }
  function applyMulti() {
    if (draftMulti.length) { onSet(draftMulti.join(",")); setOpen(false) }
    else { onRemove(); setOpen(false) }
  }

  function displayValue() {
    if (!value || value === "true") return ""
    if (def.type === "number") return def.unit ? `${value} ${def.unit}` : value
    if (def.type === "select") return value
    const parts = value.split(",")
    return parts.length <= 2 ? parts.join(", ") : `${parts[0]} +${parts.length - 1}`
  }

  const filtered = (def.options ?? []).filter(o => !search || o.toLowerCase().includes(search.toLowerCase()))
  const dv = displayValue()

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={openPopup}
        className={cn(
          "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary border-primary/20"
            : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border/80"
        )}
      >
        <span>{def.label}{dv ? `: ${dv}` : ""}</span>
        {isActive && (
          <span role="button" onClick={e => { e.stopPropagation(); onRemove() }} className="ml-0.5 hover:text-destructive transition-colors">
            <X size={10} />
          </span>
        )}
      </button>

      {open && (
        <div className={cn("absolute top-full mt-1.5 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden", popupDir === "right" ? "right-0" : "left-0")} style={{ minWidth: "13rem" }}>
          {def.type === "number" && (
            <div className="p-3 space-y-2">
              <div className="text-xs font-medium text-foreground">{def.label}</div>
              <div className="flex items-center gap-1.5">
                <Input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)}
                  placeholder={def.placeholder} className="h-7 text-xs flex-1"
                  onKeyDown={e => e.key === "Enter" && applyNumber()} />
                {def.unit && <span className="text-xs text-muted-foreground shrink-0">{def.unit}</span>}
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={applyNumber}>Apply</Button>
            </div>
          )}
          {def.type === "select" && (
            <div className="p-1">
              <div className="px-2 py-1.5 text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wide">{def.label}</div>
              {(def.options ?? []).map(opt => (
                <button key={opt} onClick={() => { onSet(opt); setOpen(false) }}
                  className={cn("w-full text-left px-2 py-1.5 text-xs rounded-md flex items-center gap-2 transition-colors",
                    value === opt ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                  <div className={cn("h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0",
                    value === opt ? "bg-primary border-primary" : "border-input")}>
                    {value === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
          )}
          {def.type === "multiselect" && (
            <>
              <div className="p-2 border-b border-border">
                <div className="flex items-center gap-1.5 px-2 h-7 rounded-md border border-input">
                  <Search size={11} className="text-muted-foreground shrink-0" />
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search..." className="flex-1 text-xs bg-transparent outline-none" />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.map(opt => {
                  const checked = draftMulti.includes(opt)
                  return (
                    <button key={opt} onClick={() => setDraftMulti(p => checked ? p.filter(x => x !== opt) : [...p, opt])}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                      <div className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
                        checked ? "bg-primary border-primary" : "border-input")}>
                        {checked && <Check size={9} className="text-primary-foreground" />}
                      </div>
                      {opt}
                    </button>
                  )
                })}
                {filtered.length === 0 && <div className="px-3 py-3 text-xs text-muted-foreground text-center">No results</div>}
              </div>
              <div className="p-2 border-t border-border">
                <Button size="sm" className="w-full h-7 text-xs" onClick={applyMulti}>
                  Apply{draftMulti.length > 0 ? ` (${draftMulti.length})` : ""}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 1: Template setup ────────────────────────────────────────────────────

function Step1Content({ form, onChange }: { form: TemplateForm; onChange: (u: Partial<TemplateForm>) => void }) {
  return (
    <>
      <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Template setup</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Name, identity, and how workloads reach these nodes.</p>
        </div>

        <FormSection title="Template name">
          <Input
            value={form.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="e.g. cost-opt-prod"
            className="max-w-sm h-9 text-sm text-foreground"
          />
          <p className="text-[0.7rem] text-amber-600 dark:text-amber-400 mt-1.5">⚠ Cannot be changed after saving</p>
        </FormSection>

        <FormSection title="Linked node configuration">
          <div className="flex items-center gap-2">
            <SplitSelect
              label="Configuration"
              value={form.nodeConfig}
              onChange={v => onChange({ nodeConfig: v })}
              options={["Default", "prod-cpu-optimized", "prod-memory-optimized", "gpu-a100-large"]}
            />
            <span className="text-xs text-muted-foreground/40 shrink-0">·</span>
            <button className="text-xs text-primary hover:underline whitespace-nowrap shrink-0">Create new node configuration →</button>
          </div>
          <button className="text-xs text-primary hover:underline mt-1.5">View configuration ↗</button>
        </FormSection>

        <FormSection title="Taints">
          <p className="text-xs text-muted-foreground mb-3">Repel pods that don't tolerate this key.</p>
          <CheckField checked={form.taintEnabled} onChange={() => onChange({ taintEnabled: !form.taintEnabled })} label="Taint nodes" />
          {form.taintEnabled && (
            <div className="mt-3">
              <RepeatableFieldGroup
                fields={[
                  { key: "key", label: "Key" },
                  { key: "value", label: "Value" },
                  { key: "effect", label: "Effect", type: "select", options: ["NoSchedule", "NoExecute", "PreferNoSchedule"], className: "w-44 shrink-0" },
                ]}
                rows={form.taints}
                onChange={(i, k, v) => onChange({ taints: form.taints.map((t, j) => j === i ? { ...t, [k]: v } : t) })}
                onRemove={i => onChange({ taints: form.taints.filter((_, j) => j !== i) })}
                onAdd={() => onChange({ taints: [...form.taints, { key: "", value: "", effect: "NoSchedule" }] })}
                addLabel="Add taint"
              />
            </div>
          )}
        </FormSection>

        <FormSection title="Labels">
          <p className="text-xs text-muted-foreground mb-3">Default nodeSelector uses the template name. Override with custom labels if needed.</p>
          <CheckField checked={form.customLabels} onChange={() => onChange({ customLabels: !form.customLabels })} label="Use custom labels" />
          {!form.customLabels && (
            <div className="mt-3">
              <Badge variant="outline" className="text-xs rounded-full font-normal px-2.5 py-0.5">
                scheduling.cast.ai/node-template: {form.name || "—"}
              </Badge>
            </div>
          )}
          {form.customLabels && (
            <div className="mt-3">
              <RepeatableFieldGroup
                fields={[
                  { key: "key", label: "Key" },
                  { key: "value", label: "Value" },
                ]}
                rows={form.labels}
                onChange={(i, k, v) => onChange({ labels: form.labels.map((l, j) => j === i ? { ...l, [k]: v } : l) })}
                onRemove={i => onChange({ labels: form.labels.filter((_, j) => j !== i) })}
                onAdd={() => onChange({ labels: [...form.labels, { key: "", value: "" }] })}
                addLabel="Add label"
              />
            </div>
          )}
        </FormSection>
      </div>

      <RightRail title="YAML preview">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">How pods will bind to nodes created by this template.</p>
          <YamlPreview form={form} />
          <div className="p-3 rounded-md border border-primary/20 bg-primary/[0.04]">
            <p className="text-xs font-medium">💡 Copy this into your Deployment</p>
            <p className="text-xs text-muted-foreground mt-1">Apply the nodeSelector + toleration to pods you want on this template's nodes.</p>
          </div>
        </div>
      </RightRail>
    </>
  )
}

// ─── Step 2: Constraints ───────────────────────────────────────────────────────

function Step2Content({ form, onChange }: { form: TemplateForm; onChange: (u: Partial<TemplateForm>) => void }) {
  const instances = computeApplicableInstances(form)
  const tightness = computeTightnessPercent(form)
  const isTight = instances <= 5

  function setCriterion(key: string, val: string) {
    onChange({ criteria: { ...form.criteria, [key]: val } })
  }
  function removeCriterion(key: string) {
    const next = { ...form.criteria }
    delete next[key]
    onChange({ criteria: next })
  }

  return (
    <>
      <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Node pool constraints</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Filter which instances are eligible. More constraints = tighter pool = higher risk.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormSection title="Resource offering">
            <div className="space-y-2">
              <CheckField checked={form.offeringOnDemand} onChange={() => onChange({ offeringOnDemand: !form.offeringOnDemand })} label="On-demand" />
              <CheckField
                checked={form.offeringSpot}
                onChange={() => onChange({ offeringSpot: !form.offeringSpot })}
                label="Spot"
                suffix={form.offeringSpot ? (
                  <span className="inline-flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium leading-none">
                    ⚡ 4 features · next step
                  </span>
                ) : undefined}
              />
            </div>
          </FormSection>
          <FormSection title="Architecture">
            <div className="space-y-2">
              <CheckField checked={form.archX86} onChange={() => onChange({ archX86: !form.archX86 })} label="x86_64" />
              <CheckField checked={form.archArm} onChange={() => onChange({ archArm: !form.archArm })} label="ARM64" />
            </div>
          </FormSection>
          <FormSection title="OS">
            <div className="space-y-2">
              <CheckField checked={form.osLinux} onChange={() => onChange({ osLinux: !form.osLinux })} label="Linux" />
              <CheckField checked={form.osWindows} onChange={() => onChange({ osWindows: !form.osWindows })} label="Windows" />
            </div>
          </FormSection>
        </div>

        <FormSection title="Instance criteria">
          <div className="flex flex-wrap gap-2">
            {CONSTRAINT_DEFS.map(def => (
              <ConstraintPill
                key={def.key}
                def={def}
                value={form.criteria[def.key]}
                onSet={val => setCriterion(def.key, val)}
                onRemove={() => removeCriterion(def.key)}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="Instance prioritization">
          <CheckField
            checked={true}
            onChange={() => {}}
            label="Ranked by instance family"
            description="Prefer specific families for more predictable performance"
          />
        </FormSection>

        <FormSection title="CPU limit">
          <div className="flex items-center gap-3">
            <CheckField checked={form.cpuLimitEnabled} onChange={() => onChange({ cpuLimitEnabled: !form.cpuLimitEnabled })} label="Enable CPU limit" />
            {form.cpuLimitEnabled && (
              <Input placeholder="max cores" className="h-8 text-xs w-28" />
            )}
          </div>
        </FormSection>
      </div>

      <RightRail title="Available instances">
        <p className="text-xs text-muted-foreground mb-3">based on the constraints added and current market availability</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold tabular-nums">{instances}</span>
        </div>

        <TightnessMeter percent={tightness} />

        {isTight && (
          <div className="mt-3 p-2.5 bg-amber-500/10 rounded-md border border-dashed border-amber-500/30">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Heads up:</strong> only {instances} instance{instances !== 1 ? "s" : ""}. If unavailable, Autoscaler can't spin up a node. Relax constraints.
            </p>
          </div>
        )}

        <InstanceTable rows={MOCK_INSTANCES.slice(0, instances)} />
      </RightRail>
    </>
  )
}

// ─── Step 3: Features ──────────────────────────────────────────────────────────

function Step3Content({ form, onChange }: { form: TemplateForm; onChange: (u: Partial<TemplateForm>) => void }) {
  const enabledCount = [
    form.spotFallback, form.interruptionPrediction, form.diversifySpot, form.reliableSpot,
    form.gpuSharing, form.standbyPool, form.liveMigration, form.storageAutoscaler,
  ].filter(Boolean).length

  return (
    <>
      <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold">Node-level features</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Toggle features on. Some have inline config; others open a dedicated setup flow.</p>
        </div>

        <div>
          <div className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Spot reliability</div>
          <div className="grid grid-cols-2 gap-2">
            <FeatureInline
              title="Spot fallback"
              desc="Fall back to on-demand when spot is unavailable."
              enabled={form.spotFallback}
              onChange={() => onChange({ spotFallback: !form.spotFallback })}
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">fallback after</span>
                <select value={form.spotFallbackDelay} onChange={e => onChange({ spotFallbackDelay: e.target.value })} className="h-7 px-2 text-xs border border-input rounded bg-background text-foreground">
                  <option>2 min</option>
                  <option>5 min</option>
                  <option>10 min</option>
                  <option>30 min</option>
                </select>
              </div>
            </FeatureInline>
            <FeatureInline
              title="Interruption prediction"
              desc="CAST ML predicts spot interruptions ahead of time."
              enabled={form.interruptionPrediction}
              onChange={() => onChange({ interruptionPrediction: !form.interruptionPrediction })}
            >
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted-foreground">sensitivity</span>
                <select className="h-7 px-2 text-xs border border-input rounded bg-background text-foreground">
                  <option>balanced</option>
                  <option>aggressive</option>
                  <option>conservative</option>
                </select>
                <CheckField checked={true} onChange={() => {}} label="auto-drain" />
              </div>
            </FeatureInline>
            <FeatureSimple
              title="Diversify spot"
              desc="Spread across instance families to reduce blast radius."
              enabled={form.diversifySpot}
              onChange={() => onChange({ diversifySpot: !form.diversifySpot })}
            />
            <FeatureSimple
              title="Reliable spot"
              desc="Prefer spot instances with longer historical lifetime."
              enabled={form.reliableSpot}
              onChange={() => onChange({ reliableSpot: !form.reliableSpot })}
            />
          </div>
        </div>

        <div>
          <div className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hardware & capacity</div>
          <div className="grid grid-cols-2 gap-2">
            <FeatureComplex
              title="GPU time sharing"
              desc="Share GPUs across multiple pods. Requires device plugin config."
              enabled={form.gpuSharing}
              onChange={() => onChange({ gpuSharing: !form.gpuSharing })}
              ctaLabel="Configure sharing"
            />
            <FeatureComplex
              title="Standby pool"
              desc="Keep warm capacity ready for traffic spikes."
              enabled={form.standbyPool}
              onChange={() => onChange({ standbyPool: !form.standbyPool })}
              ctaLabel="Set up pool"
            />
          </div>
        </div>

        <div>
          <div className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Advanced</div>
          <div className="grid grid-cols-2 gap-2">
            <FeatureComplex
              title="Container live migration"
              desc="Migrate running containers between nodes with no restart."
              enabled={form.liveMigration}
              onChange={() => onChange({ liveMigration: !form.liveMigration })}
              ctaLabel="Open migration setup"
            />
            <FeatureComplex
              title="Storage autoscaler"
              desc="Auto-resize attached volumes based on usage."
              enabled={form.storageAutoscaler}
              onChange={() => onChange({ storageAutoscaler: !form.storageAutoscaler })}
              ctaLabel="Configure policies"
            />
            <FeatureSimple
              title="Edge locations"
              desc="Deploy nodes to edge regions."
              enabled={false}
              onChange={() => {}}
              locked
              lockReason="contact sales"
            />
            <FeatureSimple
              title="Windows-only features"
              desc="Additional Windows configuration options."
              enabled={false}
              onChange={() => {}}
              locked={!form.osWindows}
              lockReason={!form.osWindows ? "requires Windows" : undefined}
            />
          </div>
        </div>
      </div>

      <RightRail title="Template summary">
        <div className="space-y-3 text-xs">
          <div>
            <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide mb-1">Targeting</div>
            <div className="font-medium">{form.name || "—"}</div>
            <div className="text-muted-foreground">{form.taintEnabled ? "tainted · " : ""}{form.nodeConfig} config</div>
          </div>
          <div className="border-t border-border/50 pt-3">
            <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide mb-1">Constraints</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {form.archX86 && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">x86_64</Badge>}
              {form.archArm && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">ARM64</Badge>}
              {form.osLinux && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">Linux</Badge>}
              {form.osWindows && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">Windows</Badge>}
              {form.offeringSpot && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal bg-primary/10 text-primary border-primary/20">Spot</Badge>}
              {form.offeringOnDemand && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">On-demand</Badge>}
              {Object.entries(form.criteria).map(([k, v]) => {
                const def = CONSTRAINT_DEFS.find(d => d.key === k)
                const label = def ? `${def.label}${v !== "true" ? `: ${v}` : ""}` : k
                return <Badge key={k} variant="outline" className="text-[0.6rem] px-1.5 font-normal">{label}</Badge>
              })}
            </div>
            {computeApplicableInstances(form) <= 5 && (
              <p className="text-[0.65rem] text-destructive mt-1.5">⚠ {computeApplicableInstances(form)} applicable instance{computeApplicableInstances(form) !== 1 ? "s" : ""}</p>
            )}
          </div>
          <div className="border-t border-border/50 pt-3">
            <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide mb-1">Features on ({enabledCount})</div>
            {form.spotFallback && <div className="text-muted-foreground">✓ Spot fallback ({form.spotFallbackDelay})</div>}
            {form.interruptionPrediction && <div className="text-muted-foreground">✓ Interruption prediction</div>}
            {form.diversifySpot && <div className="text-muted-foreground">✓ Diversify spot</div>}
            {form.reliableSpot && <div className="text-muted-foreground">✓ Reliable spot</div>}
            {form.gpuSharing && <div className="text-muted-foreground">✓ GPU time sharing</div>}
            {form.standbyPool && <div className="text-muted-foreground">✓ Standby pool</div>}
            {enabledCount === 0 && <div className="text-muted-foreground italic">None enabled</div>}
          </div>
          {form.offeringSpot && (form.spotFallback || form.interruptionPrediction) && (
            <div className="border-t border-border/50 pt-3 p-2.5 bg-primary/5 rounded-md border border-primary/10">
              <p className="font-medium mb-0.5">Dependencies honoured</p>
              <p className="text-muted-foreground">Spot features are linked to the Spot offering in step 2.</p>
            </div>
          )}
        </div>
      </RightRail>
    </>
  )
}

// ─── Scenario picker ───────────────────────────────────────────────────────────

function ScenarioPicker({ onSelect, onBlank, onCancel }: {
  onSelect: (presetId: string) => void
  onBlank: () => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<string>("cost-optimized")
  const [query, setQuery] = useState("")

  const filtered = PRESETS.filter(p =>
    query === "" ||
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.desc.toLowerCase().includes(query.toLowerCase())
  )

  const selectedPreset = PRESETS.find(p => p.id === selected)

  function handleContinue() {
    if (selected === "blank") {
      onBlank()
    } else {
      onSelect(selected)
    }
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <PageHeader
        title="New node template"
        breadcrumbs={[...FLOW_BREADCRUMBS_BASE, { label: "New template" }]}
        actions={<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>}
      />

      {/* Body */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">How would you like to start?</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick a preset and we'll pre-fill sensible defaults — or start from a blank template.</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder='Search presets — e.g. "spot fallback", "gpu", "windows"...'
              className="pl-9 h-9 text-sm"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.6rem] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </div>

          {/* Presets */}
          <div className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Start from a preset</div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "text-left p-4 rounded-lg border-2 flex items-start gap-3 transition-colors",
                  selected === p.id
                    ? "border-primary/50 bg-primary/[0.03]"
                    : "border-border hover:border-border/70 bg-card"
                )}
              >
                <span className="text-2xl leading-none mt-0.5">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.title}</span>
                    {p.tag && <Badge variant="outline" className="text-[0.6rem] px-1.5 border-primary/30 text-primary">{p.tag}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
                {selected === p.id && <Check size={15} className="text-primary shrink-0 mt-0.5" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-2 text-sm text-muted-foreground text-center py-4">No presets match your search.</p>
            )}
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-dashed border-border" />
            <span className="text-xs text-muted-foreground">or build your own</span>
            <div className="flex-1 border-t border-dashed border-border" />
          </div>

          {/* Blank hero — selectable like presets */}
          <button
            onClick={() => setSelected("blank")}
            className={cn(
              "w-full text-left p-5 rounded-lg border-2 flex items-center gap-5 transition-colors",
              selected === "blank"
                ? "border-primary/50 bg-primary/[0.03]"
                : "border-dashed border-border bg-muted/20 hover:border-border/80"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 transition-colors",
              selected === "blank" ? "border-primary/50 bg-primary/5" : "border-border bg-card"
            )}>
              {selected === "blank"
                ? <Check size={24} className="text-primary" />
                : <Plus size={24} className="text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">Blank template</span>
                <Badge variant="outline" className="text-[0.6rem] px-1.5">full control</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Start from scratch. Best when no preset matches your workload.</p>
              <div className="flex gap-3 mt-2 text-[0.65rem] text-muted-foreground">
                <span>✎ define every field</span>
                <span>·</span>
                <span>🛠 full feature access</span>
                <span>·</span>
                <span>🧑‍💻 recommended for experts</span>
              </div>
            </div>
          </button>

          {/* Footer */}
          <div className="flex justify-between mt-8 pt-5 border-t border-border">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleContinue}>
              {selected === "blank"
                ? "Start blank →"
                : `Continue with ${selectedPreset?.title ?? "preset"} →`
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Edit template view ────────────────────────────────────────────────────────

type EditSection = "setup" | "constraints" | "features"

function EditTemplateView({ template, form, onSave, onCancel }: {
  template: NodeTemplate
  form: TemplateForm
  onSave: () => void
  onCancel: () => void
}) {
  const [activeSection, setActiveSection] = useState<EditSection>("constraints")
  const [editForm, setEditForm] = useState<TemplateForm>(form)
  const instances = computeApplicableInstances(editForm)
  const tightness = computeTightnessPercent(editForm)

  function onChange(u: Partial<TemplateForm>) {
    setEditForm(prev => ({ ...prev, ...u }))
  }

  const enabledFeatures = [
    editForm.spotFallback && `Spot fallback (${editForm.spotFallbackDelay})`,
    editForm.interruptionPrediction && "Interruption prediction",
    editForm.diversifySpot && "Diversify spot",
    editForm.reliableSpot && "Reliable spot",
    editForm.gpuSharing && "GPU time sharing",
  ].filter(Boolean) as string[]

  const isTight = instances <= 5

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <PageHeader
        title={template.name}
        breadcrumbs={[...FLOW_BREADCRUMBS_BASE, { label: template.name }]}
      />

      {/* 3-panel layout */}
      <div className="flex-1 flex w-full">
        {/* Left: section nav cards */}
        <div className="w-64 border-r border-border bg-muted/20 overflow-y-auto p-4 shrink-0">
          <div className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Template sections</div>
          {(["setup", "constraints", "features"] as EditSection[]).map(section => {
            const isActive = activeSection === section
            const criteriaCount = Object.keys(editForm.criteria).length
            const info = {
              setup: {
                num: 1, title: "Template setup",
                status: "complete",
                lines: [`name: ${editForm.name || "—"}`, editForm.taintEnabled ? "taint: enabled" : "no taint", "labels: default nodeSelector"],
              },
              constraints: {
                num: 2, title: "Constraints",
                status: criteriaCount > 0 ? `${criteriaCount} criteria` : "default",
                lines: [
                  [editForm.archX86 && "x86_64", editForm.archArm && "ARM64"].filter(Boolean).join(" · "),
                  [editForm.osLinux && "Linux", editForm.osWindows && "Windows"].filter(Boolean).join(" · "),
                  editForm.offeringSpot && !editForm.offeringOnDemand ? "Spot only"
                    : !editForm.offeringSpot && editForm.offeringOnDemand ? "On-demand only"
                    : "Spot + On-demand",
                  ...(criteriaCount > 0
                    ? [Object.keys(editForm.criteria).slice(0, 2).map(k => {
                        const def = CONSTRAINT_DEFS.find(d => d.key === k)
                        const v = editForm.criteria[k]
                        return def ? `${def.label}${v !== "true" ? `: ${v}` : ""}` : k
                      }).join(" · ")]
                    : []),
                ],
                warn: instances <= 5 ? `only ${instances} instance${instances !== 1 ? "s" : ""}` : undefined,
              },
              features: {
                num: 3, title: "Features",
                status: `${enabledFeatures.length} on`,
                lines: enabledFeatures.length > 0 ? enabledFeatures.slice(0, 3) : ["No features enabled"],
              },
            }[section]

            return (
              <button key={section} onClick={() => setActiveSection(section)}
                className={cn("w-full text-left p-3 rounded-lg border mb-2.5 transition-colors",
                  isActive ? "border-primary bg-card shadow-sm" : "border-border bg-background hover:bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[0.65rem] font-bold shrink-0",
                    isActive ? "bg-primary text-white" : "bg-foreground text-background")}>
                    {info.num}
                  </div>
                  <span className="text-sm font-semibold flex-1">{info.title}</span>
                  <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">{info.status}</Badge>
                </div>
                <div className="pl-7 space-y-0.5">
                  {info.lines.filter(Boolean).map((line, i) => (
                    <div key={i} className="text-xs text-muted-foreground truncate">{line}</div>
                  ))}
                  {"warn" in info && info.warn && (
                    <div className="text-[0.65rem] text-destructive mt-1">⚠ {info.warn}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Center: active section */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          {activeSection === "setup" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Template setup</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Name, identity, and how workloads reach these nodes.</p>
              </div>
              <FormSection title="Template name">
                <Input value={editForm.name} onChange={e => onChange({ name: e.target.value })} className="max-w-sm h-9 text-sm" />
                <p className="text-[0.7rem] text-amber-600 dark:text-amber-400 mt-1.5">⚠ Cannot be changed after saving</p>
              </FormSection>
              <FormSection title="Linked node configuration">
                <SplitSelect label="Configuration" value={editForm.nodeConfig}
                  onChange={v => onChange({ nodeConfig: v })}
                  options={["Default", "prod-cpu-optimized", "prod-memory-optimized", "gpu-a100-large"]} />
                <div className="flex items-center gap-2 mt-1.5">
                  <button className="text-xs text-primary hover:underline">View configuration ↗</button>
                  <span className="text-xs text-muted-foreground/40 shrink-0">·</span>
                  <button className="text-xs text-primary hover:underline whitespace-nowrap shrink-0">Create new node configuration →</button>
                </div>
              </FormSection>
              <FormSection title="Taints">
                <p className="text-xs text-muted-foreground mb-3">Repel pods that don't tolerate this key.</p>
                <CheckField checked={editForm.taintEnabled} onChange={() => onChange({ taintEnabled: !editForm.taintEnabled })} label="Taint nodes" />
                {editForm.taintEnabled && (
                  <div className="mt-3">
                    <RepeatableFieldGroup
                      fields={[
                        { key: "key", label: "Key" },
                        { key: "value", label: "Value" },
                        { key: "effect", label: "Effect", type: "select", options: ["NoSchedule", "NoExecute", "PreferNoSchedule"], className: "w-44 shrink-0" },
                      ]}
                      rows={editForm.taints}
                      onChange={(i, k, v) => onChange({ taints: editForm.taints.map((t, j) => j === i ? { ...t, [k]: v } : t) })}
                      onRemove={i => onChange({ taints: editForm.taints.filter((_, j) => j !== i) })}
                      onAdd={() => onChange({ taints: [...editForm.taints, { key: "", value: "", effect: "NoSchedule" }] })}
                      addLabel="Add taint"
                    />
                  </div>
                )}
              </FormSection>
              <FormSection title="Labels">
                <p className="text-xs text-muted-foreground mb-3">Default nodeSelector uses the template name. Override with custom labels if needed.</p>
                <CheckField checked={editForm.customLabels} onChange={() => onChange({ customLabels: !editForm.customLabels })} label="Use custom labels" />
                {!editForm.customLabels && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs rounded-full font-normal px-2.5 py-0.5">
                      scheduling.cast.ai/node-template: {editForm.name || "—"}
                    </Badge>
                  </div>
                )}
                {editForm.customLabels && (
                  <div className="mt-3">
                    <RepeatableFieldGroup
                      fields={[{ key: "key", label: "Key" }, { key: "value", label: "Value" }]}
                      rows={editForm.labels}
                      onChange={(i, k, v) => onChange({ labels: editForm.labels.map((l, j) => j === i ? { ...l, [k]: v } : l) })}
                      onRemove={i => onChange({ labels: editForm.labels.filter((_, j) => j !== i) })}
                      onAdd={() => onChange({ labels: [...editForm.labels, { key: "", value: "" }] })}
                      addLabel="Add label"
                    />
                  </div>
                )}
              </FormSection>
            </div>
          )}

          {activeSection === "constraints" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Node pool constraints</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Filter which instances are eligible. More constraints = tighter pool = higher risk.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormSection title="Resource offering">
                  <div className="space-y-2">
                    <CheckField checked={editForm.offeringOnDemand} onChange={() => onChange({ offeringOnDemand: !editForm.offeringOnDemand })} label="On-demand" />
                    <CheckField checked={editForm.offeringSpot} onChange={() => onChange({ offeringSpot: !editForm.offeringSpot })} label="Spot"
                      suffix={editForm.offeringSpot ? (
                        <span className="inline-flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium leading-none">
                          ⚡ 4 features · next step
                        </span>
                      ) : undefined} />
                  </div>
                </FormSection>
                <FormSection title="Architecture">
                  <div className="space-y-2">
                    <CheckField checked={editForm.archX86} onChange={() => onChange({ archX86: !editForm.archX86 })} label="x86_64" />
                    <CheckField checked={editForm.archArm} onChange={() => onChange({ archArm: !editForm.archArm })} label="ARM64" />
                  </div>
                </FormSection>
                <FormSection title="OS">
                  <div className="space-y-2">
                    <CheckField checked={editForm.osLinux} onChange={() => onChange({ osLinux: !editForm.osLinux })} label="Linux" />
                    <CheckField checked={editForm.osWindows} onChange={() => onChange({ osWindows: !editForm.osWindows })} label="Windows" />
                  </div>
                </FormSection>
              </div>
              <FormSection title="Instance criteria">
                <div className="flex flex-wrap gap-2">
                  {CONSTRAINT_DEFS.map(def => (
                    <ConstraintPill key={def.key} def={def} value={editForm.criteria[def.key]}
                      onSet={val => onChange({ criteria: { ...editForm.criteria, [def.key]: val } })}
                      onRemove={() => { const next = { ...editForm.criteria }; delete next[def.key]; onChange({ criteria: next }) }} />
                  ))}
                </div>
              </FormSection>
            </div>
          )}

          {activeSection === "features" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Node-level features</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Toggle features on. Some have inline config; others open a dedicated setup flow.</p>
              </div>
              <div>
                <div className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Spot reliability</div>
                <div className="space-y-2">
                  <FeatureInline title="Spot fallback" desc="Fall back to on-demand when spot is unavailable." enabled={editForm.spotFallback} onChange={() => onChange({ spotFallback: !editForm.spotFallback })}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">fallback after</span>
                      <select value={editForm.spotFallbackDelay} onChange={e => onChange({ spotFallbackDelay: e.target.value })} className="h-7 px-2 text-xs border border-input rounded bg-background text-foreground">
                        <option>2 min</option><option>5 min</option><option>10 min</option><option>30 min</option>
                      </select>
                    </div>
                  </FeatureInline>
                  <FeatureSimple title="Interruption prediction" desc="CAST ML predicts spot interruptions ahead of time." enabled={editForm.interruptionPrediction} onChange={() => onChange({ interruptionPrediction: !editForm.interruptionPrediction })} />
                  <FeatureSimple title="Diversify spot" desc="Spread across instance families to reduce blast radius." enabled={editForm.diversifySpot} onChange={() => onChange({ diversifySpot: !editForm.diversifySpot })} />
                  <FeatureSimple title="Reliable spot" desc="Prefer spot instances with longer historical lifetime." enabled={editForm.reliableSpot} onChange={() => onChange({ reliableSpot: !editForm.reliableSpot })} />
                </div>
              </div>
              <div>
                <div className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hardware & capacity</div>
                <div className="space-y-2">
                  <FeatureComplex title="GPU time sharing" desc="Share GPUs across multiple pods. Requires device plugin config." enabled={editForm.gpuSharing} onChange={() => onChange({ gpuSharing: !editForm.gpuSharing })} ctaLabel="Configure sharing" />
                  <FeatureComplex title="Standby pool" desc="Keep warm capacity ready for traffic spikes." enabled={editForm.standbyPool} onChange={() => onChange({ standbyPool: !editForm.standbyPool })} ctaLabel="Set up pool" />
                  <FeatureSimple title="Storage autoscaler" desc="Auto-resize attached volumes based on usage." enabled={editForm.storageAutoscaler} onChange={() => onChange({ storageAutoscaler: !editForm.storageAutoscaler })} />
                  <FeatureSimple title="Live migration" desc="Migrate running containers between nodes with no restart." enabled={editForm.liveMigration} onChange={() => onChange({ liveMigration: !editForm.liveMigration })} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: contextual rail — mirrors create flow per section */}
        {activeSection === "setup" && (
          <RightRail title="YAML preview">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">How pods will bind to nodes created by this template.</p>
              <YamlPreview form={editForm} />
              <div className="p-3 rounded-md border border-primary/20 bg-primary/[0.04]">
                <p className="text-xs font-medium">💡 Copy this into your Deployment</p>
                <p className="text-xs text-muted-foreground mt-1">Apply the nodeSelector + toleration to pods you want on this template's nodes.</p>
              </div>
            </div>
          </RightRail>
        )}
        {activeSection === "constraints" && (
          <RightRail title="Available instances">
            <p className="text-xs text-muted-foreground mb-3">based on the constraints added and current market availability</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold tabular-nums">{instances}</span>
            </div>
            <TightnessMeter percent={tightness} />
            {isTight && (
              <div className="mt-3 p-2.5 bg-amber-500/10 rounded-md border border-dashed border-amber-500/30">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Heads up:</strong> only {instances} instance{instances !== 1 ? "s" : ""}. If unavailable, Autoscaler can't spin up a node. Relax constraints.
                </p>
              </div>
            )}
            <InstanceTable rows={MOCK_INSTANCES.slice(0, instances)} />
          </RightRail>
        )}
        {activeSection === "features" && (
          <RightRail title="Template summary">
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide mb-1">Targeting</div>
                <div className="font-medium">{editForm.name || "—"}</div>
                <div className="text-muted-foreground">{editForm.taintEnabled ? "tainted · " : ""}{editForm.nodeConfig} config</div>
              </div>
              <div className="border-t border-border/50 pt-3">
                <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide mb-2">Constraints</div>
                <div className="flex flex-wrap gap-1.5">
                  {editForm.archX86 && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">x86_64</Badge>}
                  {editForm.archArm && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">ARM64</Badge>}
                  {editForm.osLinux && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">Linux</Badge>}
                  {editForm.osWindows && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">Windows</Badge>}
                  {editForm.offeringSpot && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal bg-primary/10 text-primary border-primary/20">Spot</Badge>}
                  {editForm.offeringOnDemand && <Badge variant="outline" className="text-[0.6rem] px-1.5 font-normal">On-demand</Badge>}
                  {Object.entries(editForm.criteria).map(([k, v]) => {
                    const def = CONSTRAINT_DEFS.find(d => d.key === k)
                    return <Badge key={k} variant="outline" className="text-[0.6rem] px-1.5 font-normal">{def ? `${def.label}${v !== "true" ? `: ${v}` : ""}` : k}</Badge>
                  })}
                </div>
              </div>
              <div className="border-t border-border/50 pt-3">
                <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide mb-1">Features on ({enabledFeatures.length})</div>
                {enabledFeatures.length > 0
                  ? enabledFeatures.map(f => <div key={f} className="text-muted-foreground">✓ {f}</div>)
                  : <div className="text-muted-foreground italic">None enabled</div>}
              </div>
            </div>
          </RightRail>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between h-16 border-t border-border px-6 shrink-0 bg-surface-paper">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} className="h-8 text-sm">Save changes</Button>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function Configurations() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState<FlowMode>("list")
  const [form, setForm] = useState<TemplateForm>(DEFAULT_FORM)
  const [editTarget, setEditTarget] = useState<NodeTemplate | null>(null)

  function startCreate() { setMode("scenario") }

  function onSelectPreset(presetId: string) {
    const preset = PRESETS.find(p => p.id === presetId)
    setForm({ ...DEFAULT_FORM, ...(PRESET_OVERRIDES[presetId] ?? {}), name: preset?.title.toLowerCase().replace(/\s+/g, "-") ?? "" })

    setMode("step1")
  }

  function onBlank() {
    setForm(DEFAULT_FORM)

    setMode("step1")
  }

  function onBack() {
    if (mode === "step2") setMode("step1")
    else if (mode === "step3") setMode("step2")
  }

  function onContinue() {
    if (mode === "step1") setMode("step2")
    else if (mode === "step2") setMode("step3")
    else if (mode === "step3") finishCreate()
  }

  function finishCreate() {
    const offering: ResOffering = form.offeringSpot && form.offeringOnDemand ? "ALL OFFERINGS" : form.offeringSpot ? "SPOT" : "ON-DEMAND"
    setTemplates(prev => [...prev, {
      id: String(Date.now()),
      name: form.name || "new-template",
      nodeConfig: form.nodeConfig,
      offering,
      nodes: 0,
      cpuEfficiency: 0,
      memEfficiency: 0,
      enabled: true,
      isDefault: false,
    }])
    setMode("list")
    setForm(DEFAULT_FORM)

  }

  function cancelFlow() {
    setMode("list")
    setForm(DEFAULT_FORM)

    setEditTarget(null)
  }

  function startEdit(t: NodeTemplate) {
    setEditTarget(t)
    setForm(templateToForm(t))
    setMode("edit")
  }

  function toggleEnabled(id: string) {
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t)))
  }

  function deleteTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const isWizardOrEdit = mode !== "list"
  const step = mode === "step1" ? 1 : mode === "step2" ? 2 : mode === "step3" ? 3 : null

  const listBreadcrumbs = [
    { label: "Acme Corp", href: "/overview" },
    { label: "Staging", href: "/cluster/dashboard" },
    { label: "Node Autoscaling", href: "/cluster/node-autoscaling" },
    { label: "Configurations" },
  ]

  return (
    <AppLayout
      pageTitle="Configurations"
      breadcrumbs={listBreadcrumbs}
      activeHref="/cluster/node-autoscaling/configurations"
      hideHeader={isWizardOrEdit}
    >
      {/* ── Scenario picker ── */}
      {mode === "scenario" && (
        <ScenarioPicker onSelect={onSelectPreset} onBlank={onBlank} onCancel={cancelFlow} />
      )}

      {/* ── Wizard ── */}
      {step !== null && (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <WizardHeader onCancel={cancelFlow} />
          <WizardStepper step={step} />
          <div className="flex-1 flex w-full">
            {step === 1 && <Step1Content form={form} onChange={u => setForm(p => ({ ...p, ...u }))} />}
            {step === 2 && <Step2Content form={form} onChange={u => setForm(p => ({ ...p, ...u }))} />}
            {step === 3 && <Step3Content form={form} onChange={u => setForm(p => ({ ...p, ...u }))} />}
          </div>
          <WizardFooter step={step} onBack={onBack} onContinue={onContinue} />
        </div>
      )}

      {/* ── Edit view ── */}
      {mode === "edit" && editTarget && (
        <EditTemplateView
          template={editTarget}
          form={form}
          onSave={cancelFlow}
          onCancel={cancelFlow}
        />
      )}

      {/* ── Listing ── */}
      {mode === "list" && (
        <>
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
              <Button variant="outline" size="sm" className="h-8 text-xs">Provision test node</Button>
              <Button size="sm" className="h-8 text-xs" onClick={startCreate}>Create template</Button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Card className="py-0 gap-0">
              <CardContent className="p-4 flex items-center gap-5">
                <DonutChart templates={templates} />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.6875rem] text-muted-foreground mb-3 uppercase tracking-wide font-medium">Templates by offering</p>
                  {(
                    [["SPOT", templates.filter(t => t.offering === "SPOT").length],
                     ["ON-DEMAND", templates.filter(t => t.offering === "ON-DEMAND").length],
                     ["ALL OFFERINGS", templates.filter(t => t.offering === "ALL OFFERINGS").length],
                    ] as [ResOffering, number][]
                  ).map(([offering, count]) => (
                    <div key={offering} className="flex items-center justify-between mb-2 last:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: offering === "SPOT" ? "var(--primary)" : offering === "ON-DEMAND" ? "var(--chart-4)" : "var(--chart-2)" }} />
                        <span className="text-xs text-muted-foreground">{offering}</span>
                      </div>
                      <span className="text-xs font-medium tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <p className="text-[0.6875rem] text-muted-foreground mb-3 uppercase tracking-wide font-medium">Features enabled</p>
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
                          <span className={feat.enabled > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>{feat.enabled}</span>
                          <span className="text-muted-foreground">/{templates.length}</span>
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem]">Template name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem]">Node configuration</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[130px]">Res. offering</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[72px]">Nodes</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[130px]">CPU eff.</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[0.6rem] w-[130px]">Mem eff.</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {templates
                  .filter(t =>
                    t.name.toLowerCase().includes(search.toLowerCase()) ||
                    t.nodeConfig.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((t) => (
                    <tr
                      key={t.id}
                      tabIndex={0}
                      className={cn("border-b border-border/50 last:border-0 transition-colors hover:bg-muted/25", !t.enabled && "opacity-50")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <TemplateToggle checked={t.enabled} onChange={() => toggleEnabled(t.id)} disabled={t.isDefault} />
                          {t.isDefault ? <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" /> : <span className="w-3 shrink-0" />}
                          <span className={cn("font-medium truncate max-w-[180px]", !t.enabled && "text-muted-foreground")}>{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.nodeConfig}</td>
                      <td className="px-4 py-3"><OfferingBadge offering={t.offering} /></td>
                      <td className="px-4 py-3 tabular-nums">{t.nodes}</td>
                      <td className="px-4 py-3"><MiniBar value={t.cpuEfficiency} /></td>
                      <td className="px-4 py-3"><MiniBar value={t.memEfficiency} /></td>
                      <td className="px-2 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" aria-haspopup="menu">
                              <MoreHorizontal size={14} />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => startEdit(t)}>
                              <Pencil size={12} /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2"><Copy size={12} /> Duplicate</DropdownMenuItem>
                            {!t.isDefault && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={() => deleteTemplate(t.id)}>
                                  <Trash2 size={12} /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                {templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.nodeConfig.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-xs">No templates match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  )
}
