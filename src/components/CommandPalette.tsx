import { useState, useEffect, useRef } from "react"
import { Command } from "cmdk"
import {
  IconSearch,
  IconHome,
  IconDatabase,
  IconCloudComputing,
  IconCpu,
  IconPackages,
  IconBolt,
  IconAdjustmentsAlt,
  IconRefresh,
  IconTrash,
  IconCreditCard,
  IconPigMoney,
  IconChartBar,
  IconListDetails,
  IconLayoutDashboard,
  IconAlertTriangle,
  IconAdjustmentsHorizontal,
  IconStack,
  IconServer,
  IconArrowLeft,
  IconBraces,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { orgNavigation, clusterNavigation, type NavEntry } from "@/config/navigation"
import { INITIAL_TEMPLATES, type ResOffering } from "@/pages/NodeTemplates"

type IconComponent = React.ComponentType<{ size?: number; className?: string }>

const ICON_MAP: Record<string, IconComponent> = {
  IconHome, IconDatabase, IconCloudComputing, IconCpu, IconPackages,
  IconBolt, IconAdjustmentsAlt, IconRefresh, IconTrash, IconCreditCard,
  IconPigMoney, IconChartBar, IconListDetails, IconLayoutDashboard,
  IconAlertTriangle, IconAdjustmentsHorizontal, IconStack, IconServer, IconArrowLeft,
}

type FlatNavItem = { label: string; href: string; group: string; iconName: string }

function flattenNav(entries: NavEntry[]): FlatNavItem[] {
  const result: FlatNavItem[] = []
  for (const entry of entries) {
    if (entry.type === "link" || entry.type === "back") {
      result.push({ label: entry.label, href: entry.href, group: "Navigation", iconName: entry.icon })
    } else if (entry.type === "group") {
      for (const child of entry.children) {
        result.push({ label: child.label, href: child.href, group: entry.label, iconName: child.icon ?? entry.icon })
      }
    }
  }
  return result
}

const ALL_NAV_ITEMS: FlatNavItem[] = [
  ...flattenNav(orgNavigation),
  ...flattenNav(clusterNavigation),
]

const OFFERING_LABEL: Record<ResOffering, string> = {
  "SPOT": "Spot",
  "ON-DEMAND": "On-demand",
  "ALL OFFERINGS": "All offerings",
}

function offeringClass(offering: ResOffering) {
  if (offering === "SPOT") return "text-amber-500 dark:text-amber-400"
  if (offering === "ON-DEMAND") return "text-blue-500 dark:text-blue-400"
  return "text-green-500 dark:text-green-400"
}

const ITEM_CLASS =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none " +
  "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"

const LIST_CLASS =
  "max-h-[360px] overflow-y-auto p-1.5 [&::-webkit-scrollbar]:hidden " +
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 " +
  "[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold " +
  "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider " +
  "[&_[cmdk-group-heading]]:text-muted-foreground"

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [comingSoon, setComingSoon] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    if (!open) setComingSoon(false)
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"

      if (e.key === "/" && !isEditing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setOpen(true)
        return
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function handleNavSelect() {
    setComingSoon(true)
    setTimeout(() => setOpen(false), 800)
  }

  return (
    <div className="relative flex w-full justify-center">
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/16"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Animated container */}
      <div
        className={cn(
          "relative z-50 w-full transition-all duration-200 ease-out",
          open ? "max-w-lg" : "max-w-sm"
        )}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setOpen(false) } }}
      >
        <Command loop shouldFilter>
          {/* Input row — animates border-radius and height */}
          <div
            className={cn(
              "flex items-center gap-2 border border-border bg-surface-paper px-3 transition-all duration-200 ease-out",
              open ? "h-10 rounded-t-xl" : "h-8 cursor-pointer rounded-pill"
            )}
            onClick={() => { if (!open) setOpen(true) }}
          >
            <IconSearch size={14} className="shrink-0 text-muted-foreground" />
            <Command.Input
              ref={inputRef}
              placeholder={open ? "Search… (⌘K or /)" : "Search..."}
              onFocus={() => setOpen(true)}
              className={cn(
                "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
                !open && "cursor-pointer"
              )}
            />
            {open ? (
              <kbd className="flex shrink-0 items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            ) : (
              <kbd className="flex shrink-0 items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <span>⌘</span><span>K</span>
              </kbd>
            )}
          </div>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute left-0 right-0 overflow-hidden rounded-b-xl border-x border-b border-border bg-surface-paper shadow-xl">
              <Command.List className={LIST_CLASS}>
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </Command.Empty>

                <Command.Group heading="Navigation">
                  {ALL_NAV_ITEMS.map((item) => {
                    const Icon = ICON_MAP[item.iconName] ?? IconHome
                    return (
                      <Command.Item
                        key={item.href}
                        value={item.label}
                        onSelect={handleNavSelect}
                        className={ITEM_CLASS}
                      >
                        <Icon size={15} className="shrink-0 text-muted-foreground" />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.group}</span>
                      </Command.Item>
                    )
                  })}
                </Command.Group>

                <Command.Separator className="mx-1 my-1 h-px bg-border" />

                <Command.Group heading="Node Templates">
                  {INITIAL_TEMPLATES.map((tpl) => (
                    <Command.Item
                      key={tpl.id}
                      value={tpl.name}
                      onSelect={() => setOpen(false)}
                      className={ITEM_CLASS}
                    >
                      <IconBraces size={15} className="shrink-0 text-muted-foreground" />
                      <span className="flex-1">{tpl.name}</span>
                      <span className={cn("text-xs font-medium", offeringClass(tpl.offering))}>
                        {OFFERING_LABEL[tpl.offering]}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              {comingSoon && (
                <div className="border-t border-border px-3 py-2 text-center text-xs text-muted-foreground">
                  Coming soon
                </div>
              )}
            </div>
          )}
        </Command>
      </div>
    </div>
  )
}
