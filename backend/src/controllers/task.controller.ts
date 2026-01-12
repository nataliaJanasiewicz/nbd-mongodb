import { Request, Response } from "express";
import mongoose from "mongoose";
import { createTaskSchema, updateTaskSchema } from "../validators/task.validators";
import * as taskService from "../services/task.service";

export async function create(req: Request, res: Response) {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const task = await taskService.createTask(parsed.data);
  return res.status(201).json(task);
}

export async function list(req: Request, res: Response) {
  const result = await taskService.listTasks(req.query as any);
  return res.json(result);
}

type IdParamRequest = Request<{ id: string }>;

export async function getOne(req: IdParamRequest, res: Response) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

  const task = await taskService.getTaskById(id);
  if (!task) return res.status(404).json({ error: "Not found" });

  return res.json(task);
}

export async function update(req: IdParamRequest, res: Response) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const task = await taskService.updateTask(id, parsed.data);
  if (!task) return res.status(404).json({ error: "Not found" });

  return res.json(task);
}

export async function remove(req: IdParamRequest, res: Response) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

  const task = await taskService.deleteTask(id);
  if (!task) return res.status(404).json({ error: "Not found" });

  return res.status(204).send();
}

export async function statsStatus(_req: Request, res: Response) {
  const data = await taskService.statsByStatus();
  return res.json(data);
}

export async function statsCategory(_req: Request, res: Response) {
  const data = await taskService.statsByCategory();
  return res.json(data);
}
