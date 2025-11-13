export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")
let hasWarnedMissingApiBase = false

function buildUrl(path: string): string {
	if (!path.startsWith("/")) {
		path = "/" + path
	}
	if (!API_BASE) {
		if (!hasWarnedMissingApiBase && typeof window !== "undefined") {
			// eslint-disable-next-line no-console
			console.warn(
				"NEXT_PUBLIC_API_BASE_URL is not set. Requests will go to the Next.js origin, which likely won't serve the PHP API. Set it to your PHP server base URL (e.g., http://localhost:8080).",
			)
			hasWarnedMissingApiBase = true
		}
	}
	return `${API_BASE}${path}`
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(buildUrl(path), {
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
		...options,
	})

	if (!res.ok) {
		let message = `Request failed with ${res.status}`
		try {
			const err = await res.json()
			message = err?.message || message
		} catch {
			// ignore json parse errors
		}
		throw new Error(message)
	}

	// Handle 204 No Content
	if (res.status === 204) return undefined as unknown as T
	return (await res.json()) as T
}

export const api = {
	login: (email: string, password: string) =>
		request<{ token: string; user: { id: number; name: string; email: string; role?: string } }>(
			"/auth/login",
			{ method: "POST", body: JSON.stringify({ email, password }) },
		),

	// Users
	getUsers: () => request<Array<{ id: number; name: string; email: string; role?: string }>>("/users"),

	// Projects
	getProjects: () => request<Array<unknown>>("/projects"),
	createProject: (data: unknown) => request<unknown>("/projects", { method: "POST", body: JSON.stringify(data) }),
	updateProject: (id: number, updates: unknown) =>
		request<unknown>("/projects", { method: "PUT", body: JSON.stringify({ id, ...(updates as object) }) }),
	archiveProject: (id: number) => request<void>("/projects/archive", { method: "POST", body: JSON.stringify({ id }) }),

	// Sprints
	getSprints: () => request<Array<unknown>>("/sprints"),
	createSprint: (data: unknown) => request<unknown>("/sprints", { method: "POST", body: JSON.stringify(data) }),
	updateSprint: (id: number, updates: unknown) =>
		request<unknown>("/sprints", { method: "PUT", body: JSON.stringify({ id, ...(updates as object) }) }),
	deleteSprint: (id: number) => request<void>("/sprints", { method: "DELETE", body: JSON.stringify({ id }) }),

	// Teams
	getTeams: () => request<Array<{ id: number; name: string; projectId: number; memberIds: number[] }>>("/teams"),
	createTeam: (data: { name: string; projectId: number }) =>
		request<{ id: number; name: string; projectId: number; memberIds: number[] }>("/teams", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	updateTeam: (id: number, updates: Partial<{ name: string; projectId: number }>) =>
		request<{ id: number; name: string; projectId: number; memberIds: number[] }>("/teams", {
			method: "PUT",
			body: JSON.stringify({ id, ...updates }),
		}),
	addTeamMember: (teamId: number, userId: number) =>
		request<{ ok: boolean }>("/teams/members", { method: "POST", body: JSON.stringify({ teamId, userId }) }),
	removeTeamMember: (teamId: number, userId: number) =>
		request<{ ok: boolean }>("/teams/members", { method: "DELETE", body: JSON.stringify({ teamId, userId }) }),

	// Backlog
	getBacklogItems: () => request<Array<unknown>>("/backlog"),
	createBacklogItem: (data: unknown) => request<unknown>("/backlog", { method: "POST", body: JSON.stringify(data) }),
	updateBacklogItem: (id: number, updates: unknown) =>
		request<unknown>(`/backlog/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
	deleteBacklogItem: (id: number) => request<void>(`/backlog/${id}`, { method: "DELETE" }),
	addComment: (id: number, data: unknown) =>
		request<unknown>(`/backlog/${id}/comments`, { method: "POST", body: JSON.stringify(data) }),

	// Tasks
	getTasks: () => request<Array<unknown>>("/tasks"),

	// Meetings
	getMeetings: () => request<Array<unknown>>("/meetings"),
	createMeeting: (data: unknown) =>
		request<unknown>("/meetings", { method: "POST", body: JSON.stringify(data) }),
	updateMeeting: (id: number, updates: unknown) =>
		request<unknown>("/meetings", { method: "PUT", body: JSON.stringify({ id, ...(updates as object) }) }),
	deleteMeeting: (id: number) =>
		request<void>("/meetings", { method: "DELETE", body: JSON.stringify({ id }) }),
}
