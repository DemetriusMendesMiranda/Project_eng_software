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
    if (confirm("Are you sure you want to delete this backlog item?")) {
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
            To Do
          </Badge>
        )
      case "InProgress":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
            In Progress
          </Badge>
        )
      case "Done":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            Done
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
    if (!userId) return "Unassigned"
    return users.find((u) => u.id === userId)?.name || "Unknown"
  }

  const getProjectName = (projectId: number) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown"
  }

  const getSprintName = (sprintId?: number) => {
    if (!sprintId) return "No Sprint"
    return sprints.find((s) => s.id === sprintId)?.name || "Unknown"
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Product Backlog</h1>
          <p className="text-muted-foreground">Manage and prioritize backlog items</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Backlog Item</DialogTitle>
              <DialogDescription>Create a new item in the product backlog</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="User Authentication"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the backlog item..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimation">Estimation (hours)</Label>
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
                      <SelectItem value="ToDo">To Do</SelectItem>
                      <SelectItem value="InProgress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={formData.projectId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, projectId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
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
                  <Label htmlFor="sprint">Sprint (Optional)</Label>
                  <Select
                    value={formData.sprintId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sprintId: value === "none" ? undefined : Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Sprint</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id.toString()}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee (Optional)</Label>
                  <Select
                    value={formData.assignedToId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignedToId: value === "none" ? undefined : Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
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
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Item</Button>
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
                <span>Estimation: {item.estimation}h</span>
                <span>Project: {getProjectName(item.projectId)}</span>
                <span>Sprint: {getSprintName(item.sprintId)}</span>
                <span>Assigned: {getUserName(item.assignedToId)}</span>
                <span>Comments: {item.comments.length}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Backlog Item</DialogTitle>
            <DialogDescription>Update backlog item details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estimation">Estimation (hours)</Label>
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
                    <SelectItem value="ToDo">To Do</SelectItem>
                    <SelectItem value="InProgress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
                <Label htmlFor="edit-sprint">Sprint (Optional)</Label>
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
                    <SelectItem value="none">No Sprint</SelectItem>
                    {sprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id.toString()}>
                        {sprint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assignee">Assignee (Optional)</Label>
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
                    <SelectItem value="none">Unassigned</SelectItem>
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
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
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
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Add Comment</Label>
              <Textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleAddComment}>Add Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
