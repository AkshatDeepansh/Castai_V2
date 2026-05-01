import { IconChevronRight } from "@tabler/icons-react"

type Crumb = {
  label: string
  href?: string
}

type PageHeaderProps = {
  title?: string
  breadcrumbs?: Crumb[]
}

const defaultBreadcrumbs: Crumb[] = [
  { label: "Acme Corp", href: "/overview" },
  { label: "Staging", href: "/cluster/dashboard" },
  { label: "Dashboard" },
]

export function PageHeader({
  title = "Dashboard",
  breadcrumbs = defaultBreadcrumbs,
}: PageHeaderProps) {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-1.5">
        <ol className="flex items-center gap-1 text-xs text-muted-foreground">
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
                  <span className={isLast ? "text-foreground font-medium" : ""} aria-current={isLast ? "page" : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
    </div>
  )
}
