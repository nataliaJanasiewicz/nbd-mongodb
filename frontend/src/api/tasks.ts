const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Task = {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  category: string;
  priority: number;
  extra: Record<string, any>;
  createdAt: string;
};

type TaskQuery = {
  q?: string;
  status?: Task["status"] | "all";
  category?: string | "all";
  sort?: string;
};

const buildQueryString = (params?: TaskQuery) => {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export async function getTasks(params?: TaskQuery) {
  const res = await fetch(`${API_URL}/tasks${buildQueryString(params)}`);
  if (!res.ok) throw new Error("Failed to load tasks");
  return res.json();
}

export async function createTask(payload: Partial<Task>) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(id: string, payload: Partial<Task>) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: string) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.text();
}
