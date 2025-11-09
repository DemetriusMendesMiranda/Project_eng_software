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
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react"
import type { ItemBacklog, ItemStatus } from "@/lib/types"

export default function BacklogPage() {
  const backlogItems = useStore((state) => state.backlogItems)
  const projects = useStore((state) => state.projects)
  const sprints = useStore((state) => state.sprints)
  const users = useStore((state) => state.users)
  const addBacklogItem = useStore((state) => state.addBacklogItem)
  const updateBacklogItem = useStore((state) => state.updateBacklogItem)
  const deleteBacklogItem = useStore((state) => state.deleteBacklogItem)
  const addComment = useStore((state) => state.addComment)
  const currentUser = useStore((state) => state.currentUser)
  const fetchBacklogItems = useStore((state) => state.fetchBacklogItems)
  const fetchProjects = useStore((state) => state.fetchProjects)
  const fetchSprints = useStore((state) => state.fetchSprints)
  const fetchUsers = useStore((state) => state.fetchUsers)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemBacklog | null>(null)
  const [selectedItem, setSelectedItem] = useState<ItemBacklog | null>(null)
  const [commentText, setCommentText] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 1,
    estimation: 0,
    status: "ToDo" as ItemStatus,
    projectId: 0,
    sprintId: undefined as number | undefined,
    assignedToId: undefined as number | undefined,
  })

  useEffect(() => {
    void Promise.all([
      fetchBacklogItems(),
      fetchProjects(),
      fetchSprints(),
      fetchUsers(),
    ])
  }, [fetchBacklogItems, fetchProjects, fetchSprints, fetchUsers])

  const handleAdd = () => {
    addBacklogItem(formData)
    setFormData({
      title: "",
      description: "",
      priority: 1,
      estimation: 0,
      status: "ToDo",
      projectId: 0,
      sprintId: undefined,
      assignedToId: undefined,
    })
    setIsAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (editingItem) {
      updateBacklogItem(editingItem.id, formData)
      setIsEditDialogOpen(false)
      setEditingItem(null)
      setFormData({
        title: "",
        description: "",
        priority: 1,
        estimation: 0,
        status: "ToDo",
        projectId: 0,
        sprintId: undefined,
        assignedToId: undefined,
      })
    }
  }

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza de que deseja excluir este item do backlog?")) {
      deleteBacklogItem(id)
    }
  }

  const handleAddComment = () => {
    if (selectedItem && commentText.trim() && currentUser) {
      addComment(selectedItem.id, {
        text: commentText,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      })
      setCommentText("")
    }
  }

  const openEditDialog = (item: ItemBacklog) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      priority: item.priority,
      estimation: item.estimation,
      status: item.status,
      projectId: item.projectId,
      sprintId: item.sprintId,
      assignedToId: item.assignedToId,
    })
    setIsEditDialogOpen(true)
  }

  const openCommentDialog = (item: ItemBacklog) => {
    setSelectedItem(item)
    setIsCommentDialogOpen(true)
  }

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case "ToDo":
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
            A Fazer
          </Badge>
        )
      case "InProgress":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
            Em Progresso
          </Badge>
        )
      case "Done":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            Concluído
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority: number) => {
    const colors = [
      "bg-red-500/10 text-red-500",
      "bg-orange-500/10 text-orange-500",
      "bg-yellow-500/10 text-yellow-500",
      "bg-green-500/10 text-green-500",
    ]
    return (
      <Badge variant="outline" className={colors[Math.min(priority - 1, 3)]}>
        P{priority}
      </Badge>
    )
  }

  const getUserName = (userId?: number) => {
    if (!userId) return "Não atribuído"
    return users.find((u) => u.id === userId)?.name || "Desconhecido"
  }

  const getProjectName = (projectId: number) => {
    return projects.find((p) => p.id === projectId)?.name || "Desconhecido"
  }

  const getSprintName = (sprintId?: number) => {
    if (!sprintId) return "Sem Sprint"
    return sprints.find((s) => s.id === sprintId)?.name || "Desconhecido"
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Backlog do Produto</h1>
          <p className="text-muted-foreground">Gerencie e priorize os itens do backlog</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Item ao Backlog</DialogTitle>
              <DialogDescription>Crie um novo item no backlog do produto</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Autenticação de Usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do item do backlog..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimation">Estimativa (horas)</Label>
                  <Input
                    id="estimation"
                    type="number"
                    min="0"
                    value={formData.estimation}
                    onChange={(e) => setFormData({ ...formData, estimation: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as ItemStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ToDo">A Fazer</SelectItem>
                      <SelectItem value="InProgress">Em Progresso</SelectItem>
                      <SelectItem value="Done">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Projeto</Label>
                  <Select
                    value={formData.projectId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, projectId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o projeto" />
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
                  <Label htmlFor="sprint">Sprint (Opcional)</Label>
                  <Select
                    value={formData.sprintId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sprintId: value === "none" ? undefined : Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Sprint</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id.toString()}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Responsável (Opcional)</Label>
                  <Select
                    value={formData.assignedToId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignedToId: value === "none" ? undefined : Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Não atribuído" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd}>Adicionar Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {backlogItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    {getStatusBadge(item.status)}
                    {getPriorityBadge(item.priority)}
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openCommentDialog(item)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>Estimativa: {item.estimation}h</span>
                <span>Projeto: {getProjectName(item.projectId)}</span>
                <span>Sprint: {getSprintName(item.sprintId)}</span>
                <span>Responsável: {getUserName(item.assignedToId)}</span>
                <span>Comentários: {item.comments.length}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Item do Backlog</DialogTitle>
            <DialogDescription>Atualize os detalhes do item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Prioridade</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estimation">Estimativa (horas)</Label>
                <Input
                  id="edit-estimation"
                  type="number"
                  min="0"
                  value={formData.estimation}
                  onChange={(e) => setFormData({ ...formData, estimation: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ItemStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ToDo">A Fazer</SelectItem>
                    <SelectItem value="InProgress">Em Progresso</SelectItem>
                    <SelectItem value="Done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="edit-sprint">Sprint (Opcional)</Label>
                <Select
                  value={formData.sprintId?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sprintId: value === "none" ? undefined : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Sprint</SelectItem>
                    {sprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id.toString()}>
                        {sprint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assignee">Responsável (Opcional)</Label>
                <Select
                  value={formData.assignedToId?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assignedToId: value === "none" ? undefined : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentários</DialogTitle>
            <DialogDescription>{selectedItem?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedItem?.comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{getUserName(comment.userId)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
              {selectedItem?.comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Ainda não há comentários</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Adicionar Comentário</Label>
              <Textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleAddComment}>Adicionar Comentário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
