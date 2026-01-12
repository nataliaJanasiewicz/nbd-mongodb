<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { getTasks, createTask, updateTask, deleteTask, type Task } from "./api/tasks";

type ExtraPair = { key: string; value: string };
type TaskFormState = {
  title: string;
  description: string;
  category: string;
  priority: number;
  extras: ExtraPair[];
};

const tasks = ref<Task[]>([]);
const loading = ref(false);

const statusColumns = [
  { key: "todo", label: "Todo", hint: "Planned work", accent: "#f4a261" },
  { key: "in_progress", label: "In progress", hint: "Currently moving", accent: "#2a9d8f" },
  { key: "done", label: "Done", hint: "Completed", accent: "#264653" }
] as const satisfies Array<{ key: Task["status"]; label: string; hint: string; accent: string }>;

const statusFilterOptions: Array<{ label: string; value: "all" | Task["status"] }> = [
  { label: "All statuses", value: "all" },
  ...statusColumns.map(option => ({ label: option.label, value: option.key }))
];
const categoryOptions = ["ogólne", "zakupy", "szkoła", "praca"];
const filters = ref({
  q: "",
  status: "all" as "all" | Task["status"],
  category: "all" as "all" | string,
  sort: "-createdAt"
});

const createEmptyExtra = (): ExtraPair => ({ key: "", value: "" });
const recordToPairs = (record?: Record<string, any>): ExtraPair[] => {
  const entries = Object.entries(record ?? {});
  return entries.length ? entries.map(([key, value]) => ({ key, value: String(value ?? "") })) : [createEmptyExtra()];
};
const pairsToRecord = (pairs: ExtraPair[]) => {
  const extra: Record<string, string> = {};
  pairs.forEach(({ key, value }) => {
    if (!key || !value) return;
    extra[key] = value;
  });
  return extra;
};

const newTaskForm = ref<TaskFormState>({
  title: "",
  description: "",
  category: "ogólne",
  priority: 3,
  extras: [createEmptyExtra()]
});

const editingTask = ref<Task | null>(null);
const editForm = ref<TaskFormState | null>(null);

const groupedColumns = computed(() =>
  statusColumns.map(column => ({
    ...column,
    items: tasks.value.filter((task: Task) => task.status === column.key)
  }))
);

const hasExtra = (task: Task) => Boolean(task.extra && Object.keys(task.extra).length);
const formatDate = (value: string) => new Date(value).toLocaleDateString();

const addExtraRow = (list: ExtraPair[]) => list.push(createEmptyExtra());
const removeExtraRow = (list: ExtraPair[], index: number) => {
  list.splice(index, 1);
  if (!list.length) list.push(createEmptyExtra());
};

const applyFilters = () => ({
  q: filters.value.q || undefined,
  status: filters.value.status,
  category: filters.value.category,
  sort: filters.value.sort
});

async function loadTasks() {
  loading.value = true;
  try {
    const data = await getTasks(applyFilters());
    tasks.value = data.items;
  } catch (error) {
    console.error("Failed to load tasks:", error);
  } finally {
    loading.value = false;
  }
}

async function addTask() {
  if (!newTaskForm.value.title.trim()) return;

  const previousCategory = newTaskForm.value.category;

  await createTask({
    title: newTaskForm.value.title,
    description: newTaskForm.value.description || undefined,
    category: newTaskForm.value.category,
    priority: newTaskForm.value.priority,
    extra: pairsToRecord(newTaskForm.value.extras)
  });

  newTaskForm.value = {
    title: "",
    description: "",
    category: previousCategory,
    priority: 3,
    extras: [createEmptyExtra()]
  };

  await loadTasks();
}

const resetFilters = () => {
  filters.value = { q: "", status: "all", category: "all", sort: "-createdAt" };
};

function startEditing(task: Task) {
  editingTask.value = task;
  editForm.value = {
    title: task.title,
    description: task.description ?? "",
    category: task.category,
    priority: task.priority,
    extras: recordToPairs(task.extra)
  };
}

function cancelEditing() {
  editingTask.value = null;
  editForm.value = null;
}

async function saveTaskEdits() {
  if (!editingTask.value || !editForm.value) return;

  await updateTask(editingTask.value._id, {
    title: editForm.value.title,
    description: editForm.value.description || undefined,
    category: editForm.value.category,
    priority: editForm.value.priority,
    extra: pairsToRecord(editForm.value.extras)
  });

  cancelEditing();
  await loadTasks();
}

async function changeStatus(task: Task, status: Task["status"]) {
  if (task.status === status) return;
  await updateTask(task._id, { status });
  await loadTasks();
}

async function removeTask(task: Task) {
  if (!confirm(`Delete "${task.title}"?`)) return;
  await deleteTask(task._id);
  await loadTasks();
}

watch(filters, () => {
  loadTasks();
}, { deep: true });

onMounted(loadTasks);
</script>

<template>
  <main class="page">
    <header class="hero">
      <h1>TO DO TASK LIST</h1>
    </header>

    <section class="panel filters-panel">
      <div class="panel-title">
        <h2>Filters</h2>
        <button type="button" class="ghost small" @click="resetFilters">Reset</button>
      </div>
      <div class="filters-grid">
        <label>
          <span>Search</span>
          <input v-model="filters.q" placeholder="Search title or text..." />
        </label>

        <label>
          <span>Status</span>
          <select v-model="filters.status">
            <option v-for="option in statusFilterOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label>
          <span>Category</span>
          <select v-model="filters.category">
            <option value="all">All categories</option>
            <option v-for="category in categoryOptions" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select v-model="filters.sort">
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-priority">Highest priority</option>
            <option value="priority">Lowest priority</option>
          </select>
        </label>
      </div>
    </section>

    <section class="panel form-panel">
      <div class="panel-title">
        <h2>Create task</h2>
        <p>Fill the essentials and attach optional extras.</p>
      </div>
      <div class="form-grid">
        <label>
          <span>Title</span>
          <input v-model="newTaskForm.title" placeholder="n.p. Zrob zakupy" />
        </label>

        <label class="full-row">
          <span>Description</span>
          <textarea v-model="newTaskForm.description" rows="3" placeholder="dodaj opis..."></textarea>
        </label>

        <label>
          <span>Category</span>
          <select v-model="newTaskForm.category">
            <option v-for="category in categoryOptions" :key="`new-${category}`" :value="category">
              {{ category }}
            </option>
          </select>
        </label>

        <label>
          <span>Priority (1-5)</span>
          <input type="number" min="1" max="5" v-model.number="newTaskForm.priority" />
        </label>
      </div>

      <div class="extras-block">
        <div class="extras-head">
          <p>Extras</p>
          <button type="button" class="secondary" @click="addExtraRow(newTaskForm.extras)">+ Add extra</button>
        </div>
        <div class="extra-grid">
          <div v-for="(pair, index) in newTaskForm.extras" :key="`new-extra-${index}`" class="extra-row">
            <input v-model="pair.key" placeholder="Field name" />
            <input v-model="pair.value" placeholder="Value" />
            <button
              v-if="newTaskForm.extras.length > 1"
              type="button"
              class="icon-button"
              @click="removeExtraRow(newTaskForm.extras, index)"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <button type="button" class="primary" @click="addTask">Add task</button>
    </section>

    <section class="board">
      <div v-for="column in groupedColumns" :key="column.key" class="column">
        <header class="column-head">
          <div>
            <p class="eyebrow" :style="{ color: column.accent }">{{ column.hint }}</p>
            <h3>{{ column.label }}</h3>
          </div>
          <span class="badge">{{ column.items.length }}</span>
        </header>

        <p v-if="!loading && !column.items.length" class="placeholder">Nothing here yet.</p>
        <p v-else-if="loading && !column.items.length" class="placeholder">Loading...</p>

        <article v-for="task in column.items" :key="task._id" class="card">
          <div class="card-head">
            <strong>{{ task.title }}</strong>
            <span class="priority">⭐ {{ task.priority }}</span>
          </div>
          <p class="meta">
            {{ task.category }}
            <span>• {{ formatDate(task.createdAt) }}</span>
          </p>
          <p v-if="task.description" class="description">{{ task.description }}</p>

          <ul v-if="hasExtra(task)" class="extra">
            <li v-for="(value, key) in task.extra" :key="key">
              <span>{{ key }}</span>
              <strong>{{ value }}</strong>
            </li>
          </ul>

          <label class="status-select">
            <span>Status</span>
            <select :value="task.status" @change="e => changeStatus(task, (e.target as HTMLSelectElement).value as Task['status'])">
              <option v-for="option in statusColumns" :key="option.key" :value="option.key">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="card-actions">
            <button type="button" class="ghost" @click="startEditing(task)">Edit</button>
            <button type="button" class="danger" @click="removeTask(task)">Delete</button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="editingTask && editForm" class="panel edit-panel">
      <div class="panel-title">
        <h2>Edit task</h2>
        <p>Updating <strong>{{ editingTask.title }}</strong></p>
      </div>

      <div class="form-grid">
        <label>
          <span>Title</span>
          <input v-model="editForm!.title" />
        </label>

        <label class="full-row">
          <span>Description</span>
          <textarea v-model="editForm!.description" rows="3"></textarea>
        </label>

        <label>
          <span>Category</span>
          <select v-model="editForm!.category">
            <option v-for="category in categoryOptions" :key="`edit-${category}`" :value="category">
              {{ category }}
            </option>
          </select>
        </label>

        <label>
          <span>Priority (1-5)</span>
          <input type="number" min="1" max="5" v-model.number="editForm!.priority" />
        </label>
      </div>

      <div class="extras-block">
        <div class="extras-head">
          <p>Extras</p>
          <button type="button" class="secondary" @click="addExtraRow(editForm!.extras)">+ Add extra</button>
        </div>
        <div class="extra-grid">
          <div v-for="(pair, index) in editForm!.extras" :key="`edit-extra-${index}`" class="extra-row">
            <input v-model="pair.key" placeholder="Field name" />
            <input v-model="pair.value" placeholder="Value" />
            <button
              v-if="editForm!.extras.length > 1"
              type="button"
              class="icon-button"
              @click="removeExtraRow(editForm!.extras, index)"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div class="edit-actions">
        <button type="button" class="ghost" @click="cancelEditing">Cancel</button>
        <button type="button" class="primary" @click="saveTaskEdits">Save changes</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding: 32px 24px 48px;
  color: #1f2933;
}

.hero {
  text-align: left;
  margin-bottom: 24px;
}

.hero h1 {
  margin: 4px 0;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
}

.sub {
  color: #475467;
  max-width: 480px;
}

.eyebrow {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin: 0;
}

.panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
  margin-bottom: 32px;
}

.panel-title h2 {
  margin: 0;
}

.panel-title p {
  margin: 4px 0 0;
  color: #61707d;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 6px;
  color: #475467;
}

.full-row {
  grid-column: 1 / -1;
}

input,
select {
  border: 1px solid #d0d5dd;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f9fafb;
}

input:focus,
select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

button.primary {
  align-self: flex-start;
  background: linear-gradient(120deg, #7c3aed, #6366f1);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

button.primary:hover {
  opacity: 0.9;
}

.secondary {
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.secondary:hover {
  background: rgba(99, 102, 241, 0.18);
}

.ghost {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.5);
  color: #334155;
  border-radius: 999px;
  padding: 8px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.ghost.small {
  padding: 6px 14px;
  font-size: 0.85rem;
}

.ghost:hover {
  border-color: #7c3aed;
  color: #7c3aed;
}

.danger {
  background: #fee2e2;
  border: none;
  color: #b91c1c;
  border-radius: 999px;
  padding: 8px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.danger:hover {
  background: #fecaca;
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.column {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  min-height: 320px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
}

.column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.badge {
  background: #e7e5ff;
  color: #4338ca;
  border-radius: 999px;
  padding: 4px 12px;
  font-weight: 600;
}

.placeholder {
  color: #94a3b8;
  font-size: 0.9rem;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.priority {
  background: #fff7ed;
  color: #c2410c;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.85rem;
}

.meta {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.description {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 12px;
}

.extra {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.extra li {
  display: flex;
  justify-content: space-between;
  padding-left: 12px;
  font-size: 0.85rem;
  color: #475467;
}

.extra strong {
  color: #111827;
}

.status-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #475467;
}

.status-select select {
  background: #eef2ff;
  border-radius: 8px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.extras-block {
  margin: 12px 0 24px;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.extras-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #475467;
}

.extra-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.extra-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.extra-row input {
  background: #fff;
}

.icon-button {
  border: none;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.1rem;
  cursor: pointer;
}

.edit-panel {
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .page {
    padding: 24px 16px;
  }

  .panel {
    padding: 20px;
  }
}
</style>
