import { create } from "zustand"
import type { User, Project, Team, Sprint, ItemBacklog, Task, Meeting, Comment } from "./types"
import { api } from "./api"

interface AppState {
  currentUser: User | null
  authToken?: string
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

  // Fetch actions
  fetchUsers: () => Promise<void>
  fetchProjects: () => Promise<void>
  fetchTeams: () => Promise<void>
  fetchSprints: () => Promise<void>
  fetchBacklogItems: () => Promise<void>
  fetchTasks: () => Promise<void>
  fetchMeetings: () => Promise<void>

  // User actions
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: number, updates: Partial<User>) => void
  deleteUser: (id: number) => void

  // Project actions
  addProject: (project: Omit<Project, "id">) => void
  updateProject: (id: number, updates: Partial<Project>) => void
  archiveProject: (id: number) => void

  // Team actions
  addTeam: (team: Omit<Team, "id">) => Promise<void>
  updateTeam: (id: number, updates: Partial<Team>) => Promise<void>
  addTeamMember: (teamId: number, userId: number) => Promise<void>
  removeTeamMember: (teamId: number, userId: number) => Promise<void>

  // Sprint actions
  addSprint: (sprint: Omit<Sprint, "id">) => Promise<void>
  updateSprint: (id: number, updates: Partial<Sprint>) => Promise<void>
  deleteSprint: (id: number) => Promise<void>

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

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  authToken: undefined,
  users: [],
  projects: [],
  teams: [] ,
  sprints: [],
  backlogItems: [],
  tasks: [],
  meetings: [],

  // Auth actions
  login: async (email: string, password: string) => {
    try {
      const { token, user } = await api.login(email, password)
      const mappedUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user as any).role || "Developer",
      }
      set({ currentUser: mappedUser, authToken: token })
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token)
        localStorage.setItem("currentUser", JSON.stringify(mappedUser))
      }
      return true
    } catch {
      return false
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken")
      localStorage.removeItem("currentUser")
    }
    set({ currentUser: null, authToken: undefined })
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  // Fetch actions
  fetchUsers: async () => {
    const users = (await api.getUsers()) as unknown as User[]
    set({ users })
  },
  fetchProjects: async () => {
    const projects = (await api.getProjects()) as unknown as Project[]
    set({ projects })
  },
  fetchTeams: async () => {
    const teams = (await api.getTeams()) as unknown as Team[]
    set({ teams })
  },
  fetchSprints: async () => {
    try {
      const sprints = (await api.getSprints()) as unknown as Sprint[]
      set({ sprints })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Falha ao carregar sprints da API. Verifique NEXT_PUBLIC_API_BASE_URL e o servidor PHP.", e)
      // Keep current state; UI will show existing/optimistic items
    }
  },
  fetchBacklogItems: async () => {
    const backlogItems = (await api.getBacklogItems()) as unknown as ItemBacklog[]
    set({ backlogItems })
  },
  fetchTasks: async () => {
    const tasks = (await api.getTasks()) as unknown as Task[]
    set({ tasks })
  },
  fetchMeetings: async () => {
    const meetings = (await api.getMeetings()) as unknown as Meeting[]
    set({ meetings })
  },

  // User actions
  addUser: (user) => {
    // Defer to backend integration when endpoint is available
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
  addProject: async (project) => {
    const created = (await api.createProject(project)) as unknown as Project
    set((state) => ({ projects: [...state.projects, created] }))
  },

  updateProject: async (id, updates) => {
    const updated = (await api.updateProject(id, updates)) as unknown as Project
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }))
  },

  archiveProject: async (id) => {
    await api.archiveProject(id)
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, archived: true } : p)),
    }))
  },

  // Team actions
  addTeam: async (team) => {
    const created = await api.createTeam({ name: team.name, projectId: team.projectId })
    const newTeam = { id: created.id, name: created.name, projectId: created.projectId, memberIds: created.memberIds }
    set((state) => ({ teams: [newTeam as unknown as Team, ...state.teams] }))
  },

  updateTeam: async (id, updates) => {
    const updated = await api.updateTeam(id, {
      name: updates.name,
      projectId: updates.projectId,
    })
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === id ? ({ id: updated.id, name: updated.name, projectId: updated.projectId, memberIds: updated.memberIds } as unknown as Team) : t,
      ),
    }))
  },

  addTeamMember: async (teamId, userId) => {
    await api.addTeamMember(teamId, userId)
    set((state) => ({
      teams: state.teams.map((t) => (t.id === teamId ? { ...t, memberIds: [...t.memberIds, userId] } : t)),
    }))
  },

  removeTeamMember: async (teamId, userId) => {
    await api.removeTeamMember(teamId, userId)
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId ? { ...t, memberIds: t.memberIds.filter((id) => id !== userId) } : t,
      ),
    }))
  },

  // Sprint actions
  addSprint: async (sprint) => {
    try {
      const created = (await api.createSprint(sprint)) as unknown as Sprint
      const merged = { ...sprint, ...created } as Sprint
      set((state) => ({ sprints: [...state.sprints, merged] }))
    } catch {
      const fallback = { ...sprint, id: Date.now() } as Sprint
      set((state) => ({ sprints: [...state.sprints, fallback] }))
    }
  },

  updateSprint: async (id, updates) => {
    try {
      const updated = (await api.updateSprint(id, updates)) as unknown as Sprint
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === id ? { ...s, ...updated } : s)),
      }))
    } catch {
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }))
    }
  },

  deleteSprint: async (id) => {
    try {
      await api.deleteSprint(id)
    } finally {
      set((state) => ({
        sprints: state.sprints.filter((s) => s.id !== id),
      }))
    }
  },

  // Backlog actions
  addBacklogItem: async (item) => {
    const created = (await api.createBacklogItem(item)) as unknown as ItemBacklog
    // Ensure comments array exists without duplicating the property
    const newItem = {
      ...created,
      comments: ((created as any)?.comments as Comment[] | undefined) ?? [],
    } as ItemBacklog
    set((state) => ({ backlogItems: [...state.backlogItems, newItem] }))
  },

  updateBacklogItem: async (id, updates) => {
    const updated = (await api.updateBacklogItem(id, updates)) as unknown as ItemBacklog
    set((state) => ({
      backlogItems: state.backlogItems.map((item) => (item.id === id ? { ...item, ...updated } : item)),
    }))
  },

  deleteBacklogItem: async (id) => {
    await api.deleteBacklogItem(id)
    set((state) => ({
      backlogItems: state.backlogItems.filter((item) => item.id !== id),
    }))
  },

  addComment: async (itemId, comment) => {
    const created = (await api.addComment(itemId, comment)) as unknown as Comment
    const newComment = created?.id ? created : { ...comment, id: Date.now() }
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
