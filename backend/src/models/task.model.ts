import mongoose, { Schema } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";

const TaskSchema = new Schema(
  {
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        default: "" 
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
      index: true
    },
    category: { 
        type: String, 
        default: "ogólne", 
        index: true 
    },
    priority: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 3, 
        index: true 
    },
    extra: { 
        type: Schema.Types.Mixed, 
        default: {} 
    }
  },
  { timestamps: true }
);

TaskSchema.index({ title: "text", description: "text", category: "text" });

export const Task = mongoose.model("Task", TaskSchema);
