import { Router } from "express";
import * as taskController from "../controllers/task.controller";

export const tasksRouter = Router();

tasksRouter.post("/", taskController.create);
tasksRouter.get("/", taskController.list);
tasksRouter.get("/_stats/by-status", taskController.statsStatus);
tasksRouter.get("/_stats/by-category", taskController.statsCategory);
tasksRouter.get("/:id", taskController.getOne);
tasksRouter.patch("/:id", taskController.update);
tasksRouter.delete("/:id", taskController.remove);
