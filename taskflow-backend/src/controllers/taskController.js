import Task from "../models/Task.js";
import User from "../models/User.js";
import redis from "../config/redis.js";
import emailQueue from "../config/emailQueue.js";

// Ek user ki saari cached task-lists clear karo (chahe kisi bhi status filter ke saath cache hui ho)
const clearUserTaskCache = async (userId) => {
  const keys = await redis.keys(`tasks:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, assignedTo } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title zaroori hai" });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      assignedTo,
      createdBy: req.user._id, // protect middleware se aaya
    });

    res.status(201).json(task);

    // Cache invalidate karo — creator aur assignee dono ki list purani ho gayi hai
    await clearUserTaskCache(req.user._id);
    if (assignedTo) await clearUserTaskCache(assignedTo);

    // Agar task kisi ko assign hua hai, to email-job queue mein daal do (background mein bhejega)
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (assignee) {
        await emailQueue.add({
          to: assignee.email,
          subject: `New task assigned: ${title}`,
          text: `Hi ${assignee.name}, aapko ek naya task assign hua hai: "${title}".`,
        });
        console.log("Email job queue mein daal diya:", assignee.email);
      } else {
        console.log("assignedTo ID se koi user nahi mila:", assignedTo);
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/tasks  (apne created ya assigned tasks, status filter ke saath)
export const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const cacheKey = `tasks:${req.user._id}:${status || "all"}`;

    // Step 1: Redis mein pehle check karo
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return res.json(JSON.parse(cached));
    }

    console.log("Cache MISS:", cacheKey);

    // Step 2: Cache mein nahi mila, MongoDB se lao
    const filter = {
      $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }],
    };
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    // Step 3: Result ko Redis mein save karo, 60 second ke liye (TTL)
    await redis.set(cacheKey, JSON.stringify(tasks), "EX", 60);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task nahi mila" });
    }

    // Sirf owner ya assignee hi update kar sake
    const isOwner = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    if (!isOwner && !isAssignee) {
      return res.status(403).json({ message: "Ye task update karne ki permission nahi hai" });
    }

    Object.assign(task, req.body);
    await task.save();

    // Cache invalidate karo — dono (owner aur assignee) ki list badal gayi ho sakti hai
    await clearUserTaskCache(task.createdBy);
    if (task.assignedTo) await clearUserTaskCache(task.assignedTo);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task nahi mila" });
    }

    // Sirf owner hi delete kar sake
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Sirf task banane wala hi delete kar sakta hai" });
    }

    await task.deleteOne();

    // Cache invalidate karo
    await clearUserTaskCache(task.createdBy);
    if (task.assignedTo) await clearUserTaskCache(task.assignedTo);

    res.json({ message: "Task delete ho gaya" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};