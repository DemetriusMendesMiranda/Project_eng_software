export type UserRole = "SuperAdmin" | "ScrumMaster" | "ProductOwner" | "Developer"

export type SprintStatus = "Planned" | "Active" | "Concluded"

export type ItemStatus = "ToDo" | "InProgress" | "Done"

export interface User {
  id: number
  name: string
  email: string
  passwordHash?: string
  role: UserRole
  avatar?: string
}

export interface Project {
  id: number
  name: string
  description: string
  startDate: string
  expectedEndDate: string
  archived: boolean
}

export interface Team {
  id: number
  name: string
  projectId: number
  memberIds: number[]
}

export interface Sprint {
  id: number
  name: string
  goal: string
  startDate: string
  endDate: string
  status: SprintStatus
  projectId: number
  teamId: number
}

export interface ItemBacklog {
  id: number
  title: string
  description: string
  priority: number
  estimation: number
  status: ItemStatus
  projectId: number
  sprintId?: number
  assignedToId?: number
  comments: Comment[]
}

export interface Task {
  id: number
  description: string
  points: number
  status: ItemStatus
  itemBacklogId: number
  assignedToId?: number
}

export interface Meeting {
  id: number
  title: string
  type: "Sprint Planning" | "Daily Standup" | "Sprint Review" | "Sprint Retrospective" | "Stakeholder Meeting"
  date: string
  duration: number
  teamId: number
  attendeeIds: number[]
  notes?: string
}

export interface Comment {
  id: number
  text: string
  userId: number
  createdAt: string
}
