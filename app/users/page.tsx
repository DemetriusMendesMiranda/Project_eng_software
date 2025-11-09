"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { User, UserRole } from "@/lib/types"

export default function UsersPage() {
  const users = useStore((state) => state.users)
  const addUser = useStore((state) => state.addUser)
  const updateUser = useStore((state) => state.updateUser)
  const deleteUser = useStore((state) => state.deleteUser)
  const fetchUsers = useStore((state) => state.fetchUsers)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passwordHash: "",
    role: "Developer" as UserRole,
  })

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const handleAdd = () => {
    addUser(formData)
    setFormData({ name: "", email: "", passwordHash: "", role: "Developer" })
    setIsAddDialogOpen(false)
  }

  const handleAddSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleAdd()
  }

  const handleEdit = () => {
    if (editingUser) {
      updateUser(editingUser.id, formData)
      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFormData({ name: "", email: "", passwordHash: "", role: "Developer" })
    }
  }

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleEdit()
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser(id)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash ?? "",
      role: user.role,
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "SuperAdmin":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "ScrumMaster":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "ProductOwner":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "Developer":
        return "bg-green-500/10 text-green-500 border-green-500/20"
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema e seus papéis</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddSubmit}>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>Crie uma nova conta de usuário com atribuição de papel</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.passwordHash}
                    onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
                    placeholder="Digite a senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Papel</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                      <SelectItem value="ScrumMaster">Scrum Master</SelectItem>
                      <SelectItem value="ProductOwner">Product Owner</SelectItem>
                      <SelectItem value="Developer">Desenvolvedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Usuário</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuários</CardTitle>
          <CardDescription>Lista de todos os usuários do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Atualize as informações e o papel do usuário</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Senha</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.passwordHash}
                  onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Papel</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                    <SelectItem value="ScrumMaster">Scrum Master</SelectItem>
                    <SelectItem value="ProductOwner">Product Owner</SelectItem>
                    <SelectItem value="Developer">Desenvolvedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
