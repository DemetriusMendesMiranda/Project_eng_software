"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, FolderKanban, Calendar, ListTodo, LogOut, UserCog, Target, Kanban } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const currentUser = useStore((state) => state.currentUser)
  const logout = useStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!currentUser) return null

  const navigation = [
    {
      name: "Painel",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["SuperAdmin", "ScrumMaster", "ProductOwner", "Developer"],
    },
    {
      name: "Usuários",
      href: "/users",
      icon: Users,
      roles: ["SuperAdmin"],
    },
    {
      name: "Projetos",
      href: "/projects",
      icon: FolderKanban,
      roles: ["SuperAdmin", "ScrumMaster", "ProductOwner"],
    },
    {
      name: "Times",
      href: "/teams",
      icon: UserCog,
      roles: ["SuperAdmin", "ScrumMaster"],
    },
    {
      name: "Sprints",
      href: "/sprints",
      icon: Target,
      roles: ["ScrumMaster", "ProductOwner", "Developer"],
    },
    {
      name: "Backlog",
      href: "/backlog",
      icon: ListTodo,
      roles: ["ProductOwner", "ScrumMaster", "Developer"],
    },
    {
      name: "Quadro",
      href: "/board",
      icon: Kanban,
      roles: ["ScrumMaster", "ProductOwner", "Developer"],
    },
    {
      name: "Reuniões",
      href: "/meetings",
      icon: Calendar,
      roles: ["ScrumMaster", "ProductOwner", "Developer"],
    },
  ]

  const filteredNavigation = navigation.filter((item) => item.roles.includes(currentUser.role))

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">S</span>
        </div>
        <span className="text-lg font-bold text-foreground">Gerenciador Scrum</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">{currentUser.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
