import "dotenv/config";
import mongoose from "mongoose";
import { Task } from "./models/task.model";

async function run() {
  await mongoose.connect(process.env.MONGO_URL!);

  await Task.deleteMany({});

  await Task.insertMany([
    {
      title: "Zrób zakupy",
      description: "Na obiad i śniadanie",
      status: "todo",
      category: "zakupy",
      priority: 3,
      extra: { listaZakupów: ["mleko", "chleb", "jajka"], sklep: "Lidl" }
    },
    {
      title: "Zadzwoń do cioci",
      status: "done",
      category: "ogólne",
      priority: 2,
      extra: { numerTelefonu: "+48 123 456 789", preferowanaGodzina: "18:00" }
    },
    {
      title: "Oddać projekt NBD",
      description: "Mongo + TypeScript + Vue",
      status: "in_progress",
      category: "szkoła",
      priority: 5,
      extra: { deadline: "16.01.2025" }
    }
  ]);

  console.log("Seed done");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
