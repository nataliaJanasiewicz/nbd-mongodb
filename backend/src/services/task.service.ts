import { Task } from "../models/task.model";

type ListQuery = {
  q?: string;
  status?: string;
  category?: string;
  priorityMin?: string;
  priorityMax?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export async function createTask(data: any) {
  return Task.create(data);
}

export async function getTaskById(id: string) {
  return Task.findById(id);
}

export async function updateTask(id: string, data: any) {
  return Task.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteTask(id: string) {
  return Task.findByIdAndDelete(id);
}

export async function listTasks(query: ListQuery) {
  const {
    q,
    status,
    category,
    priorityMin,
    priorityMax,
    sort = "-createdAt",
  } = query;

  const filter: any = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  if (priorityMin || priorityMax) {
    filter.priority = {};
    if (priorityMin) filter.priority.$gte = Number(priorityMin);
    if (priorityMax) filter.priority.$lte = Number(priorityMax);
  }

  const findQuery = q
    ? Task.find({ ...filter, $text: { $search: q } }, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
    : Task.find(filter).sort(sort);

  const items = await findQuery;
  const total = await Task.countDocuments(q ? { ...filter, $text: { $search: q } } : filter);

  return { items, total};
}

export async function statsByStatus() {
  return Task.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgPriority: { $avg: "$priority" }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

export async function statsByCategory() {
  return Task.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
}
