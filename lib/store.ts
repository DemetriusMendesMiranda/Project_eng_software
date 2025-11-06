import { create } from "zustand"
import type { User, Project, Team, Sprint, ItemBacklog, Task, Meeting, Comment } from "./types"

interface AppState {
  currentUser: User | null
  users: User[]
  projects: Project[]
  teams: Team[]
  sprints: Sprint[]
  backlogItems: ItemBacklog[]
  tasks: Task[]
  meetings: Meeting[]

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setCurrentUser: (user: User | null) => void

  // User actions
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: number, updates: Partial<User>) => void
  deleteUser: (id: number) => void

  // Project actions
  addProject: (project: Omit<Project, "id">) => void
  updateProject: (id: number, updates: Partial<Project>) => void
  archiveProject: (id: number) => void

  // Team actions
  addTeam: (team: Omit<Team, "id">) => void
  updateTeam: (id: number, updates: Partial<Team>) => void
  addTeamMember: (teamId: number, userId: number) => void
  removeTeamMember: (teamId: number, userId: number) => void

  // Sprint actions
  addSprint: (sprint: Omit<Sprint, "id">) => void
  updateSprint: (id: number, updates: Partial<Sprint>) => void

  // Backlog actions
  addBacklogItem: (item: Omit<ItemBacklog, "id" | "comments">) => void
  updateBacklogItem: (id: number, updates: Partial<ItemBacklog>) => void
  deleteBacklogItem: (id: number) => void
  addComment: (itemId: number, comment: Omit<Comment, "id">) => void

  // Task actions
  addTask: (task: Omit<Task, "id">) => void
  updateTask: (id: number, updates: Partial<Task>) => void

  // Meeting actions
  addMeeting: (meeting: Omit<Meeting, "id">) => void
  updateMeeting: (id: number, updates: Partial<Meeting>) => void
  deleteMeeting: (id: number) => void
}

// Mock data
const mockUsers: User[] = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@scrum.com",
    passwordHash: "admin123",
    role: "SuperAdmin",
  },
  {
    id: 2,
    name: "John Smith",
    email: "john@scrum.com",
    passwordHash: "scrum123",
    role: "ScrumMaster",
  },
  {
    id: 3,
    name: "Sarah Johnson",
    email: "sarah@scrum.com",
    passwordHash: "product123",
    role: "ProductOwner",
  },
  {
    id: 4,
    name: "Mike Chen",
    email: "mike@scrum.com",
    passwordHash: "dev123",
    role: "Developer",
  },
  {
    id: 5,
    name: "Emily Davis",
    email: "emily@scrum.com",
    passwordHash: "dev123",
    role: "Developer",
  },
]

const mockProjects: Project[] = [
  {
    id: 1,
    name: "E-Commerce Platform",
    description: "Building a modern e-commerce platform with React and Node.js",
    startDate: "2025-01-01",
    expectedEndDate: "2025-06-30",
    archived: false,
  },
  {
    id: 2,
    name: "Mobile App Development",
    description: "Cross-platform mobile application for iOS and Android",
    startDate: "2025-02-01",
    expectedEndDate: "2025-08-31",
    archived: false,
  },
]

const mockTeams: Team[] = [
  {
    id: 1,
    name: "Alpha Team",
    projectId: 1,
    memberIds: [2, 4, 5],
  },
]

const mockSprints: Sprint[] = [
  {
    id: 1,
    name: "Sprint 1",
    goal: "Setup project infrastructure and authentication",
    startDate: "2025-01-01",
    endDate: "2025-01-14",
    status: "Active",
    projectId: 1,
    teamId: 1,
  },
]

const mockBacklogItems: ItemBacklog[] = [
  {
    id: 1,
    title: "User Authentication",
    description: "Implement user login and registration",
    priority: 1,
    estimation: 8,
    status: "InProgress",
    projectId: 1,
    sprintId: 1,
    assignedToId: 4,
    comments: [],
  },
  {
    id: 2,
    title: "Product Catalog",
    description: "Create product listing and detail pages",
    priority: 2,
    estimation: 13,
    status: "ToDo",
    projectId: 1,
    sprintId: 1,
    comments: [],
  },
  {
    id: 3,
    title: "Shopping Cart",
    description: "Implement shopping cart functionality",
    priority: 3,
    estimation: 8,
    status: "ToDo",
    projectId: 1,
    comments: [],
  },
]

const mockTasks: Task[] = [
  {
    id: 1,
    description: "Setup authentication API",
    points: 5,
    status: "Done",
    itemBacklogId: 1,
    assignedToId: 4,
  },
  {
    id: 2,
    description: "Create login UI",
    points: 3,
    status: "InProgress",
    itemBacklogId: 1,
    assignedToId: 4,
  },
]

const mockMeetings: Meeting[] = [
  {
    id: 1,
    title: "Sprint Planning",
    type: "Sprint Planning",
    date: "2025-01-01T09:00:00",
    duration: 120,
    teamId: 1,
    attendeeIds: [2, 3, 4, 5],
  },
  {
    id: 2,
    title: "Daily Standup",
    type: "Daily Standup",
    date: "2025-01-06T09:00:00",
    duration: 15,
    teamId: 1,
    attendeeIds: [2, 4, 5],
  },
]

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: mockUsers,
  projects: mockProjects,
  teams: mockTeams,
  sprints: mockSprints,
  backlogItems: mockBacklogItems,
  tasks: mockTasks,
  meetings: mockMeetings,

  // Auth actions
  login: async (email: string, password: string) => {
    const user = get().users.find((u) => u.email === email && u.passwordHash === password)
    if (user) {
      set({ currentUser: user })
      return true
    }
    return false
  },

  logout: () => set({ currentUser: null }),

  setCurrentUser: (user) => set({ currentUser: user }),

  // User actions
  addUser: (user) => {
    const newUser = { ...user, id: Date.now() }
    set((state) => ({ users: [...state.users, newUser] }))
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }))
  },

  deleteUser: (id) => {
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }))
  },

  // Project actions
  addProject: (project) => {
    const newProject = { ...project, id: Date.now() }
    set((state) => ({ projects: [...state.projects, newProject] }))
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  },

  archiveProject: (id) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, archived: true } : p)),
    }))
  },

  // Team actions
  addTeam: (team) => {
    const newTeam = { ...team, id: Date.now() }
    set((state) => ({ teams: [...state.teams, newTeam] }))
  },

  updateTeam: (id, updates) => {
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  addTeamMember: (teamId, userId) => {
    set((state) => ({
      teams: state.teams.map((t) => (t.id === teamId ? { ...t, memberIds: [...t.memberIds, userId] } : t)),
    }))
  },

  removeTeamMember: (teamId, userId) => {
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId ? { ...t, memberIds: t.memberIds.filter((id) => id !== userId) } : t,
      ),
    }))
  },

  // Sprint actions
  addSprint: (sprint) => {
    const newSprint = { ...sprint, id: Date.now() }
    set((state) => ({ sprints: [...state.sprints, newSprint] }))
  },

  updateSprint: (id, updates) => {
    set((state) => ({
      sprints: state.sprints.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }))
  },

  // Backlog actions
  addBacklogItem: (item) => {
    const newItem = { ...item, id: Date.now(), comments: [] }
    set((state) => ({ backlogItems: [...state.backlogItems, newItem] }))
  },

  updateBacklogItem: (id, updates) => {
    set((state) => ({
      backlogItems: state.backlogItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  },

  deleteBacklogItem: (id) => {
    set((state) => ({
      backlogItems: state.backlogItems.filter((item) => item.id !== id),
    }))
  },

  addComment: (itemId, comment) => {
    const newComment = { ...comment, id: Date.now() }
    set((state) => ({
      backlogItems: state.backlogItems.map((item) =>
        item.id === itemId ? { ...item, comments: [...item.comments, newComment] } : item,
      ),
    }))
  },

  // Task actions
  addTask: (task) => {
    const newTask = { ...task, id: Date.now() }
    set((state) => ({ tasks: [...state.tasks, newTask] }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  // Meeting actions
  addMeeting: (meeting) => {
    const newMeeting = { ...meeting, id: Date.now() }
    set((state) => ({ meetings: [...state.meetings, newMeeting] }))
  },

  updateMeeting: (id, updates) => {
    set((state) => ({
      meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))
  },

  deleteMeeting: (id) => {
    set((state) => ({
      meetings: state.meetings.filter((m) => m.id !== id),
    }))
  },
}))
