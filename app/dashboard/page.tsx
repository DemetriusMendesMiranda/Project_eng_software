"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderKanban, Target, ListTodo } from "lucide-react"

export default function DashboardPage() {
  const currentUser = useStore((state) => state.currentUser)
  const users = useStore((state) => state.users)
  const projects = useStore((state) => state.projects)
  const sprints = useStore((state) => state.sprints)
  const backlogItems = useStore((state) => state.backlogItems)
  const fetchUsers = useStore((state) => state.fetchUsers)
  const fetchProjects = useStore((state) => state.fetchProjects)
  const fetchSprints = useStore((state) => state.fetchSprints)
  const fetchBacklogItems = useStore((state) => state.fetchBacklogItems)

  useEffect(() => {
    void Promise.all([fetchUsers(), fetchProjects(), fetchSprints(), fetchBacklogItems()])
  }, [fetchUsers, fetchProjects, fetchSprints, fetchBacklogItems])

  const activeProjects = projects.filter((p) => !p.archived)
  const activeSprints = sprints.filter((s) => s.status === "Active")
  const myTasks = backlogItems.filter((item) => item.assignedToId === currentUser?.id)

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      color: "text-blue-500",
      show: currentUser?.role === "SuperAdmin",
    },
    {
      title: "Active Projects",
      value: activeProjects.length,
      icon: FolderKanban,
      color: "text-purple-500",
      show: true,
    },
    {
      title: "Active Sprints",
      value: activeSprints.length,
      icon: Target,
      color: "text-green-500",
      show: true,
    },
    {
      title: "My Tasks",
      value: myTasks.length,
      icon: ListTodo,
      color: "text-orange-500",
      show: currentUser?.role === "Developer",
    },
  ].filter((stat) => stat.show)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {currentUser?.name}</h1>
        <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Active Sprints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSprints.slice(0, 3).map((sprint) => (
                <div key={sprint.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{sprint.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{sprint.goal}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
