import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { tasksRouter } from "./routes/tasks.routes";

async function bootstrap() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/tasks", tasksRouter);

  const mongoUrl = process.env.MONGO_URL!;
  await mongoose.connect(mongoUrl);

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`API on :${port}`));
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
