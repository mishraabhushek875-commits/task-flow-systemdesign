import mongoose from "mongoose";





/*Task tumhara Mongoose model hai.

Example conceptual schema:

Task
 ├── title
 ├── description
 ├── status
 ├── dueDate
 ├── createdBy
 └── assignedTo

Database me roughly document:

{
  "title": "Task number 1",
  "status": "pending",
  "dueDate": "...",
  "createdBy": "...",
  "assignedTo": "..."
}*/
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    dueDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Query fast karne ke liye index — assignedTo + dueDate se filter/sort common hoga
taskSchema.index({ assignedTo: 1, dueDate: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;