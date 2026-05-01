export type NavItem = {
  label: string
  href: string
  icon: string
  children?: NavItem[]
}

export type NavGroup = {
  type: "group"
  label: string
  icon: string
  children: NavItem[]
}

export type NavLink = {
  type: "link"
  label: string
  href: string
  icon: string
}

export type NavBackLink = {
  type: "back"
  label: string
  href: string
  icon: string
}

export type NavEntry = NavLink | NavGroup | NavBackLink

export const orgNavigation: NavEntry[] = [
  {
    type: "link",
    label: "Overview",
    href: "/overview",
    icon: "IconHome",
  },
  {
    type: "group",
    label: "Resource Management",
    icon: "IconDatabase",
    children: [
      { label: "Clusters", href: "/clusters", icon: "IconCloudComputing" },
      { label: "Nodes", href: "/nodes", icon: "IconCpu" },
      { label: "Workloads", href: "/workloads", icon: "IconPackages" },
    ],
  },
  {
    type: "group",
    label: "Optimization",
    icon: "IconBolt",
    children: [
      { label: "Autoscaler", href: "/autoscaler", icon: "IconAdjustmentsAlt" },
      { label: "Karpenter", href: "/karpenter", icon: "IconBolt" },
      { label: "Rebalancer", href: "/rebalancer", icon: "IconRefresh" },
      { label: "Evictor", href: "/evictor", icon: "IconTrash" },
    ],
  },
  {
    type: "group",
    label: "Cost Management",
    icon: "IconCreditCard",
    children: [
      { label: "Savings", href: "/savings", icon: "IconPigMoney" },
      { label: "Reports", href: "/reports", icon: "IconChartBar" },
      { label: "Audit Log", href: "/audit-log", icon: "IconListDetails" },
    ],
  },
]

export const clusterNavigation: NavEntry[] = [
  {
    type: "back",
    label: "Back to organization",
    href: "/overview",
    icon: "IconArrowLeft",
  },
  {
    type: "link",
    label: "Dashboard",
    href: "/cluster/dashboard",
    icon: "IconLayoutDashboard",
  },
  {
    type: "link",
    label: "Issues and Health",
    href: "/cluster/health",
    icon: "IconAlertTriangle",
  },
  {
    type: "link",
    label: "Optimization Settings",
    href: "/cluster/optimization-settings",
    icon: "IconAdjustmentsHorizontal",
  },
  {
    type: "group",
    label: "Workload Autoscaling",
    icon: "IconStack",
    children: [
      { label: "Overview", href: "/cluster/workload-autoscaling", icon: "IconLayoutGrid" },
      { label: "Configuration", href: "/cluster/workload-autoscaling/config", icon: "IconAdjustments" },
      { label: "History", href: "/cluster/workload-autoscaling/history", icon: "IconHistory" },
    ],
  },
  {
    type: "group",
    label: "Node Autoscaling",
    icon: "IconServer",
    children: [
      { label: "Overview", href: "/cluster/node-autoscaling", icon: "IconLayoutGrid" },
      { label: "Node Templates", href: "/cluster/node-autoscaling/templates", icon: "IconTemplate" },
      { label: "Policies", href: "/cluster/node-autoscaling/policies", icon: "IconShieldCheck" },
    ],
  },
  {
    type: "group",
    label: "Cost Management",
    icon: "IconCreditCard",
    children: [
      { label: "Savings", href: "/cluster/savings", icon: "IconPigMoney" },
      { label: "Reports", href: "/cluster/reports", icon: "IconChartBar" },
    ],
  },
  {
    type: "link",
    label: "Audit Log",
    href: "/cluster/audit-log",
    icon: "IconListDetails",
  },
]
