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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Calendar, Clock, UsersIcon } from "lucide-react"
import type { Meeting } from "@/lib/types"

export default function MeetingsPage() {
  const meetings = useStore((state) => state.meetings)
  const teams = useStore((state) => state.teams)
  const users = useStore((state) => state.users)
  const addMeeting = useStore((state) => state.addMeeting)
  const updateMeeting = useStore((state) => state.updateMeeting)
  const deleteMeeting = useStore((state) => state.deleteMeeting)
  const fetchMeetings = useStore((state) => state.fetchMeetings)
  const fetchTeams = useStore((state) => state.fetchTeams)
  const fetchUsers = useStore((state) => state.fetchUsers)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    type: "Daily Standup" as Meeting["type"],
    date: "",
    duration: 15,
    teamId: 0,
    attendeeIds: [] as number[],
    notes: "",
  })

  useEffect(() => {
    void Promise.all([fetchMeetings(), fetchTeams(), fetchUsers()])
  }, [fetchMeetings, fetchTeams, fetchUsers])

  const handleAdd = () => {
    addMeeting(formData)
    setFormData({
      title: "",
      type: "Daily Standup",
      date: "",
      duration: 15,
      teamId: 0,
      attendeeIds: [],
      notes: "",
    })
    setIsAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (editingMeeting) {
      updateMeeting(editingMeeting.id, formData)
      setIsEditDialogOpen(false)
      setEditingMeeting(null)
      setFormData({
        title: "",
        type: "Daily Standup",
        date: "",
        duration: 15,
        teamId: 0,
        attendeeIds: [],
        notes: "",
      })
    }
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      deleteMeeting(id)
    }
  }

  const openEditDialog = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setFormData({
      title: meeting.title,
      type: meeting.type,
      date: meeting.date,
      duration: meeting.duration,
      teamId: meeting.teamId,
      attendeeIds: meeting.attendeeIds,
      notes: meeting.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const toggleAttendee = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(userId)
        ? prev.attendeeIds.filter((id) => id !== userId)
        : [...prev.attendeeIds, userId],
    }))
  }

  const getTeamName = (teamId: number) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown"
  }

  const getUserName = (userId: number) => {
    return users.find((u) => u.id === userId)?.name || "Unknown"
  }

  const getMeetingTypeBadge = (type: Meeting["type"]) => {
    const colors: Record<Meeting["type"], string> = {
      "Sprint Planning": "bg-blue-500/10 text-blue-500",
      "Daily Standup": "bg-green-500/10 text-green-500",
      "Sprint Review": "bg-purple-500/10 text-purple-500",
      "Sprint Retrospective": "bg-orange-500/10 text-orange-500",
      "Stakeholder Meeting": "bg-red-500/10 text-red-500",
    }
    return (
      <Badge variant="outline" className={colors[type]}>
        {type}
      </Badge>
    )
  }

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastMeetings = meetings
    .filter((m) => new Date(m.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Meeting Management</h1>
          <p className="text-muted-foreground">Schedule and manage team meetings</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>Create a new meeting for your team</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Sprint Planning Meeting"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Meeting Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Meeting["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sprint Planning">Sprint Planning</SelectItem>
                      <SelectItem value="Daily Standup">Daily Standup</SelectItem>
                      <SelectItem value="Sprint Review">Sprint Review</SelectItem>
                      <SelectItem value="Sprint Retrospective">Sprint Retrospective</SelectItem>
                      <SelectItem value="Stakeholder Meeting">Stakeholder Meeting</SelectItem>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={formData.attendeeIds.includes(user.id)}
                        onCheckedChange={() => toggleAttendee(user.id)}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {user.name} ({user.role})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Meeting agenda or notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Schedule Meeting</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {upcomingMeetings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Meetings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="border-blue-500/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          {getMeetingTypeBadge(meeting.type)}
                        </div>
                        <CardDescription>Team: {getTeamName(meeting.teamId)}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(meeting)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(meeting.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(meeting.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(meeting.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            ({meeting.duration} min)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UsersIcon className="h-4 w-4" />
                        <span>{meeting.attendeeIds.length} attendees</span>
                      </div>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground border-t pt-3 mt-3">{meeting.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pastMeetings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Past Meetings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {pastMeetings.map((meeting) => (
                <Card key={meeting.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          {getMeetingTypeBadge(meeting.type)}
                        </div>
                        <CardDescription>Team: {getTeamName(meeting.teamId)}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(meeting.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(meeting.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            ({meeting.duration} min)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UsersIcon className="h-4 w-4" />
                        <span>{meeting.attendeeIds.length} attendees</span>
                      </div>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground border-t pt-3 mt-3">{meeting.notes}</p>
                      )}
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
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update meeting details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Meeting Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Meeting Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Meeting["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sprint Planning">Sprint Planning</SelectItem>
                    <SelectItem value="Daily Standup">Daily Standup</SelectItem>
                    <SelectItem value="Sprint Review">Sprint Review</SelectItem>
                    <SelectItem value="Sprint Retrospective">Sprint Retrospective</SelectItem>
                    <SelectItem value="Stakeholder Meeting">Stakeholder Meeting</SelectItem>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date & Time</Label>
                <Input
                  id="edit-date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="5"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Attendees</Label>
              <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-user-${user.id}`}
                      checked={formData.attendeeIds.includes(user.id)}
                      onCheckedChange={() => toggleAttendee(user.id)}
                    />
                    <label
                      htmlFor={`edit-user-${user.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {user.name} ({user.role})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
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
