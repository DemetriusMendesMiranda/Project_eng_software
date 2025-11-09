export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

function buildUrl(path: string): string {
	if (!path.startsWith("/")) {
		path = "/" + path
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
		request<unknown>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
	archiveProject: (id: number) => request<void>(`/projects/${id}/archive`, { method: "POST" }),

	// Sprints
	getSprints: () => request<Array<unknown>>("/sprints"),

	// Teams
	getTeams: () => request<Array<unknown>>("/teams"),

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
}
