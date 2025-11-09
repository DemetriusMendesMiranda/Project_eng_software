"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { useStore } from "@/lib/store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"

export default function BoardPage() {
  const projects = useStore((state) => state.projects)
  const sprints = useStore((state) => state.sprints)
  const fetchProjects = useStore((state) => state.fetchProjects)
  const fetchSprints = useStore((state) => state.fetchSprints)
  const fetchBacklogItems = useStore((state) => state.fetchBacklogItems)
  const fetchUsers = useStore((state) => state.fetchUsers)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null)

  useEffect(() => {
    void Promise.all([fetchProjects(), fetchSprints(), fetchBacklogItems(), fetchUsers()])
  }, [fetchProjects, fetchSprints, fetchBacklogItems, fetchUsers])

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Quadro Kanban</h1>
        <p className="text-muted-foreground mb-4">Arraste e solte itens para atualizar o status</p>

        <div className="flex gap-4">
          <div className="w-64">
            <Label htmlFor="project-filter">Filtrar por Projeto</Label>
            <Select
              value={selectedProject?.toString() || "all"}
              onValueChange={(value) => setSelectedProject(value === "all" ? null : Number.parseInt(value))}
            >
              <SelectTrigger id="project-filter">
                <SelectValue placeholder="Todos os Projetos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetos</SelectItem>
                {projects
                  .filter((p) => !p.archived)
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Label htmlFor="sprint-filter">Filtrar por Sprint</Label>
            <Select
              value={selectedSprint?.toString() || "all"}
              onValueChange={(value) => setSelectedSprint(value === "all" ? null : Number.parseInt(value))}
            >
              <SelectTrigger id="sprint-filter">
                <SelectValue placeholder="Todas as Sprints" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Sprints</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id.toString()}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}
