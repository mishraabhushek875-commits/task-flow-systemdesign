import dotenv from "dotenv";
dotenv.config();

import emailQueue from "../config/emailQueue.js";
import { sendTaskEmail } from "../services/emailService.js";

// Ye function queue mein jo bhi job aayegi, usko process karega
emailQueue.process(async (job) => {
  console.log("Job mili, process kar rahe hain:", job.id, job.data);
  await sendTaskEmail(job.data);
});

console.log("Email worker chalu ho gaya — jobs ka wait kar raha hai...");