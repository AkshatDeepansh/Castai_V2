import { useState } from "react"
import fullLogoDark from "@/assets/Full logo dark.svg"
import fullLogoWhite from "@/assets/Full logo white.svg"
import {
  IconBell,
  IconChevronDown,
  IconBuildingSkyscraper,
  IconCheck,
} from "@tabler/icons-react"
import { Sun, Moon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchCommand } from "@/components/CommandPalette"

const ORGS = [
  { id: "acme", name: "Acme Corp" },
  { id: "staging-org", name: "Staging Org" },
  { id: "dev-sandbox", name: "Dev Sandbox" },
]

export function AppHeader() {
  const [activeOrg, setActiveOrg] = useState(ORGS[0])
  const [isDark, setIsDark] = useState(true)

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
  }

  return (
    <header className="h-9 mx-3 mt-2 px-2 grid grid-cols-[220px_1fr_auto] items-center">
      {/* Logo — left cell */}
      <div className="flex items-center px-4">
        <img
          src={isDark ? fullLogoWhite : fullLogoDark}
          alt="CAST AI"
          className="h-5 w-auto"
        />
      </div>

      {/* Search — center cell */}
      <div className="flex justify-center">
        <SearchCommand />
      </div>

      {/* Actions — right cell */}
      <div className="flex items-center gap-3 px-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <IconBell size={16} />
          </Button>
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive"
            aria-label="Unread notifications"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  AK
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs font-medium">
              Akshat K.
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2" onClick={toggleTheme}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              Toggle theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm text-destructive focus:text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2"
              aria-label="Switch organization"
            >
              <IconBuildingSkyscraper size={14} />
              {activeOrg.name}
              <IconChevronDown size={12} className="opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ORGS.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => setActiveOrg(org)}
                className="text-sm gap-2"
              >
                <span className="flex-1">{org.name}</span>
                {activeOrg.id === org.id && (
                  <IconCheck size={13} className="text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
