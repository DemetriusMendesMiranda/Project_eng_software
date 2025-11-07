"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Calendar } from "lucide-react"
import type { Sprint, SprintStatus } from "@/lib/types"

export default function SprintsPage() {
  const sprints = useStore((state) => state.sprints)
  const projects = useStore((state) => state.projects)
  const teams = useStore((state) => state.teams)
  const addSprint = useStore((state) => state.addSprint)
  const updateSprint = useStore((state) => state.updateSprint)
  const fetchSprints = useStore((state) => state.fetchSprints)
  const fetchProjects = useStore((state) => state.fetchProjects)
  const fetchTeams = useStore((state) => state.fetchTeams)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    status: "Planned" as SprintStatus,
    projectId: 0,
    teamId: 0,
  })

  useEffect(() => {
    void Promise.all([fetchSprints(), fetchProjects(), fetchTeams()])
  }, [fetchSprints, fetchProjects, fetchTeams])

  const handleAdd = () => {
    addSprint(formData)
    setFormData({
      name: "",
      goal: "",
      startDate: "",
      endDate: "",
      status: "Planned",
      projectId: 0,
      teamId: 0,
    })
    setIsAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (editingSprint) {
      updateSprint(editingSprint.id, formData)
      setIsEditDialogOpen(false)
      setEditingSprint(null)
      setFormData({
        name: "",
        goal: "",
        startDate: "",
        endDate: "",
        status: "Planned",
        projectId: 0,
        teamId: 0,
      })
    }
  }

  const openEditDialog = (sprint: Sprint) => {
    setEditingSprint(sprint)
    setFormData({
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
      projectId: sprint.projectId,
      teamId: sprint.teamId,
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: SprintStatus) => {
    switch (status) {
      case "Planned":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
            Planned
          </Badge>
        )
      case "Active":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            Active
          </Badge>
        )
      case "Concluded":
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
            Concluded
          </Badge>
        )
    }
  }

  const getProjectName = (projectId: number) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown"
  }

  const getTeamName = (teamId: number) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown"
  }

  const activeSprints = sprints.filter((s) => s.status === "Active")
  const plannedSprints = sprints.filter((s) => s.status === "Planned")
  const concludedSprints = sprints.filter((s) => s.status === "Concluded")

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sprint Management</h1>
          <p className="text-muted-foreground">Plan and track your sprints</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Sprint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Sprint</DialogTitle>
              <DialogDescription>Create a new sprint with goals and timeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sprint Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sprint 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as SprintStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Concluded">Concluded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Sprint Goal</Label>
                <Textarea
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="What do you want to achieve in this sprint?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={formData.projectId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, projectId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
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
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select
                    value={formData.teamId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, teamId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Sprint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {activeSprints.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Active Sprints</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activeSprints.map((sprint) => (
                <Card key={sprint.id} className="border-green-500/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{sprint.name}</CardTitle>
                          {getStatusBadge(sprint.status)}
                        </div>
                        <CardDescription>{sprint.goal}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(sprint)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(sprint.startDate).toLocaleDateString()} -{" "}
                          {new Date(sprint.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">
                          Project: <span className="text-foreground">{getProjectName(sprint.projectId)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Team: <span className="text-foreground">{getTeamName(sprint.teamId)}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {plannedSprints.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Planned Sprints</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {plannedSprints.map((sprint) => (
                <Card key={sprint.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{sprint.name}</CardTitle>
                          {getStatusBadge(sprint.status)}
                        </div>
                        <CardDescription>{sprint.goal}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(sprint)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(sprint.startDate).toLocaleDateString()} -{" "}
                          {new Date(sprint.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">
                          Project: <span className="text-foreground">{getProjectName(sprint.projectId)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Team: <span className="text-foreground">{getTeamName(sprint.teamId)}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {concludedSprints.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Concluded Sprints</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {concludedSprints.map((sprint) => (
                <Card key={sprint.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{sprint.name}</CardTitle>
                          {getStatusBadge(sprint.status)}
                        </div>
                        <CardDescription>{sprint.goal}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(sprint.startDate).toLocaleDateString()} -{" "}
                          {new Date(sprint.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">
                          Project: <span className="text-foreground">{getProjectName(sprint.projectId)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Team: <span className="text-foreground">{getTeamName(sprint.teamId)}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
            <DialogDescription>Update sprint information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Sprint Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as SprintStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Concluded">Concluded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal">Sprint Goal</Label>
              <Textarea
                id="edit-goal"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project">Project</Label>
                <Select
                  value={formData.projectId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, projectId: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              <div className="space-y-2">
                <Label htmlFor="edit-team">Team</Label>
                <Select
                  value={formData.teamId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, teamId: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
