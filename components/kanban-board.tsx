"use client"

import type React from "react"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ItemBacklog, ItemStatus } from "@/lib/types"

export function KanbanBoard() {
  const backlogItems = useStore((state) => state.backlogItems)
  const updateBacklogItem = useStore((state) => state.updateBacklogItem)
  const users = useStore((state) => state.users)
  const [draggedItem, setDraggedItem] = useState<ItemBacklog | null>(null)

  const columns: { status: ItemStatus; title: string; color: string }[] = [
    { status: "ToDo", title: "To Do", color: "bg-gray-500/10 border-gray-500/20" },
    { status: "InProgress", title: "In Progress", color: "bg-blue-500/10 border-blue-500/20" },
    { status: "Done", title: "Done", color: "bg-green-500/10 border-green-500/20" },
  ]

  const getItemsByStatus = (status: ItemStatus) => {
    return backlogItems.filter((item) => item.status === status)
  }

  const handleDragStart = (item: ItemBacklog) => {
    setDraggedItem(item)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (status: ItemStatus) => {
    if (draggedItem && draggedItem.status !== status) {
      updateBacklogItem(draggedItem.id, { status })
    }
    setDraggedItem(null)
  }

  const getUserName = (userId?: number) => {
    if (!userId) return "Unassigned"
    return users.find((u) => u.id === userId)?.name || "Unknown"
  }

  const getPriorityColor = (priority: number) => {
    const colors = ["text-red-500", "text-orange-500", "text-yellow-500", "text-green-500"]
    return colors[Math.min(priority - 1, 3)]
  }

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {columns.map((column) => (
        <div
          key={column.status}
          className="flex flex-col"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.status)}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">{column.title}</h3>
            <p className="text-sm text-muted-foreground">{getItemsByStatus(column.status).length} items</p>
          </div>
          <div className={cn("flex-1 rounded-lg border-2 border-dashed p-4 space-y-3", column.color)}>
            {getItemsByStatus(column.status).map((item) => (
              <Card
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                className={cn(
                  "cursor-move transition-all hover:shadow-lg",
                  draggedItem?.id === item.id && "opacity-50",
                )}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-tight">{item.title}</CardTitle>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(item.priority))}>
                      P{item.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.estimation}h</span>
                    <div className="flex items-center gap-1">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {getUserName(item.assignedToId).charAt(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {getItemsByStatus(column.status).length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Drop items here</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
