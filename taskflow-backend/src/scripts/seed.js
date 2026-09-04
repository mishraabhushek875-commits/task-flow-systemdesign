import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

dotenv.config();

const statuses = ["pending", "in-progress", "completed"];

const seed = async () => {
  await connectDB();

  console.log("Purana data clear kar rahe hain...");
  await User.deleteMany({});
  await Task.deleteMany({});

  console.log("Dummy users bana rahe hain...");
  const users = await User.create([
    { name: "Abhishek", email: "abhishek@test.com", password: "password123" },
    { name: "Priya", email: "priya@test.com", password: "password123" },
    { name: "Rahul", email: "rahul@test.com", password: "password123" },
  ]);

  console.log("100 dummy tasks bana rahe hain...");
  const tasks = [];
  for (let i = 1; i <= 100; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomAssignee = users[Math.floor(Math.random() * users.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Due dates ko agle 60 dinon mein spread karo
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60));

    tasks.push({
      title: `Task number ${i}`,
      description: `Ye ${i}-va dummy task hai testing ke liye`,
      status: randomStatus,
      dueDate,
      createdBy: randomUser._id,
      assignedTo: randomAssignee._id,
    });
  }

  await Task.insertMany(tasks);

  console.log("Seeding complete! 3 users + 100 tasks bana diye.");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding fail ho gayi:", err);
  process.exit(1);
});