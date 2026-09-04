import Queue from "bull";

// Ye queue Redis pe hi chalti hai (wahi Redis jo humne Day 4 mein cache ke liye use kiya)
const emailQueue = new Queue("email-notifications", process.env.REDIS_URL);

export default emailQueue;