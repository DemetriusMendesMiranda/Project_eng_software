"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Pencil, UserPlus, UserMinus } from "lucide-react"
import type { Team } from "@/lib/types"

export default function TeamsPage() {
  const teams = useStore((state) => state.teams)
  const projects = useStore((state) => state.projects)
  const users = useStore((state) => state.users)
  const addTeam = useStore((state) => state.addTeam)
  const updateTeam = useStore((state) => state.updateTeam)
  const addTeamMember = useStore((state) => state.addTeamMember)
  const removeTeamMember = useStore((state) => state.removeTeamMember)
  const fetchTeams = useStore((state) => state.fetchTeams)
  const fetchUsers = useStore((state) => state.fetchUsers)
  const fetchProjects = useStore((state) => state.fetchProjects)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    projectId: 0,
  })

  useEffect(() => {
    void Promise.all([fetchTeams(), fetchUsers(), fetchProjects()])
  }, [fetchTeams, fetchUsers, fetchProjects])

  const handleAdd = () => {
    addTeam({ ...formData, memberIds: [] })
    setFormData({ name: "", projectId: 0 })
    setIsAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (editingTeam) {
      updateTeam(editingTeam.id, formData)
      setIsEditDialogOpen(false)
      setEditingTeam(null)
      setFormData({ name: "", projectId: 0 })
    }
  }

  const handleAddMember = () => {
    if (selectedTeam && selectedUserId) {
      addTeamMember(selectedTeam.id, Number.parseInt(selectedUserId))
      setSelectedUserId("")
    }
  }

  const handleRemoveMember = (teamId: number, userId: number) => {
    if (confirm("Remover este membro do time?")) {
      removeTeamMember(teamId, userId)
    }
  }

  const openEditDialog = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      projectId: team.projectId,
    })
    setIsEditDialogOpen(true)
  }

  const openMemberDialog = (team: Team) => {
    setSelectedTeam(team)
    setIsMemberDialogOpen(true)
  }

  const getProjectName = (projectId: number) => {
    return projects.find((p) => p.id === projectId)?.name || "Desconhecido"
  }

  const getUserName = (userId: number) => {
    return users.find((u) => u.id === userId)?.name || "Desconhecido"
  }

  const getAvailableUsers = (team: Team) => {
    return users.filter((u) => !team.memberIds.includes(u.id))
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Times</h1>
          <p className="text-muted-foreground">Gerencie os times e seus membros</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Time</DialogTitle>
              <DialogDescription>Crie um novo time para um projeto</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Time</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Time Alpha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Projeto</Label>
                <Select
                  value={formData.projectId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, projectId: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd}>Adicionar Time</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription className="mt-1">Projeto: {getProjectName(team.projectId)}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(team)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Membros ({team.memberIds.length})</span>
                  <Button variant="outline" size="sm" onClick={() => openMemberDialog(team)}>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {team.memberIds.map((userId) => (
                    <div key={userId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{getUserName(userId)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveMember(team.id, userId)}
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {team.memberIds.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Ainda não há membros</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Time</DialogTitle>
            <DialogDescription>Atualize as informações do time</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Time</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project">Projeto</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Time</DialogTitle>
            <DialogDescription>Adicionar um usuário ao {selectedTeam?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Selecionar Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTeam &&
                    getAvailableUsers(selectedTeam).map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember}>Adicionar Membro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
