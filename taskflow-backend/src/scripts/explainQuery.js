import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Task from "../models/Task.js";

dotenv.config();

/*
Connect MongoDB
      ↓
Ek sample task nikalo
      ↓
assignedTo ke basis par tasks search karo
      ↓
dueDate se sort karo
      ↓
explain("executionStats")
      ↓
MongoDB bataega query kaise execute hui
*/

const runExplain = async () => {
  await connectDB();

  console.log("\n--- Query: assignedTo + dueDate se filter (INDEX ke saath) ---\n");

  const sampleTask = await Task.findOne();


/*Task.findOne()
const sampleTask = await Task.findOne();

Iska matlab:

Database se koi ek task nikaalo.

Suppose:

sampleTask.assignedTo
        ↓
64abc123...

Ab script ko pata hai ki kisi ek user ko kaunse tasks assigned hain.*/

  const result = await Task.find({
    assignedTo: sampleTask.assignedTo,
  })
    .sort({ dueDate: 1 })

    /*
    .explain("executionStats");

Ye query ko execute karke MongoDB se performance information mangta hai.

Ye batata hai:

Query kaise execute hui?
Index laga?
Kitne documents check kiye?
Kitne documents mile?
Kitna time laga?

System Design ke liye ye bahut important concept hai.
    */
    .explain("executionStats");

    /*
    Ye sabse important part hai:

const result = await Task.find({
  assignedTo: sampleTask.assignedTo,
})
  .sort({ dueDate: 1 })
  .explain("executionStats");

Iska simple Hindi meaning:

"Mujhe is user ko assigned saare tasks do aur unko dueDate ke ascending order me arrange karo."

Example:

User = Abhishek


Tasks:


Task A → dueDate 20 Aug
Task B → dueDate 25 Aug
Task C → dueDate 19 Aug

Query ke baad:

Task C → 19 Aug
Task A → 20 Aug
Task B → 25 Aug


-----------------

.sort({ dueDate: 1 })

means:

Old date → New date

Aur:

.sort({ dueDate: -1 })

means:

New date → Old date
    */

  console.log("Stage used:", result.executionStats.executionStages.stage);
  console.log("Documents examined:", result.executionStats.totalDocsExamined);
  console.log("Documents returned:", result.executionStats.nReturned);
  console.log("Execution time (ms):", result.executionStats.executionTimeMillis);

  process.exit(0);
};


runExplain().catch((err) => {
  console.error("Explain fail ho gaya:", err);
  process.exit(1);
});

/*
Tum print kar rahe ho:

console.log(
  "Stage used:",
  result.executionStats.executionStages.stage
);

Isse tum dekh sakte ho ki MongoDB ne query kaise perform ki.

Commonly tumhe:

COLLSCAN

ya:

IXSCAN

dikhega.

COLLSCAN

MongoDB collection ke documents ko scan kar raha hai.

Conceptually:

Task 1
Task 2
Task 3
Task 4
Task 5
...
Task 100

Har document check karna.

Agar 10 million documents hain, expensive ho sakta hai.

IXSCAN

MongoDB index use kar raha hai.

Conceptually:

Query
 ↓
Index
 ↓
Relevant documents

------------------
totalDocsExamined
result.executionStats.totalDocsExamined

Ye batata hai:

MongoDB ne kitne documents examine kiye.

Suppose:

1000 documents database me
100 matching documents

Agar:

totalDocsExamined = 1000
nReturned = 100

to MongoDB ne 1000 documents check kiye.

Agar index properly use hua:

totalDocsExamined = 100
nReturned = 100

to query much more efficient hai.

------------
nReturned
result.executionStats.nReturned

Kitne documents query ne return kiye.

Example:

nReturned = 35

means:

35 tasks us user ko assigned hain.

11. executionTimeMillis
result.executionStats.executionTimeMillis

Query execute hone me kitna time laga.

executionTimeMillis
result.executionStats.executionTimeMillis

Query execute hone me kitna time laga.

Example:

Execution time: 3 ms

Ye performance measurement hai.

*/