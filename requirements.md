# TaskFlow — Requirements Document (Day 1)

## Project Overview
TaskFlow ek task-management API hai jisme users signup/login kar sakte hain, tasks create/assign/update kar sakte hain. Ye project system design ke saare core architecture layers (API, DB, Cache, Queue, Infra, Monitoring) hands-on cover karne ke liye banaya ja raha hai.

## Functional Requirements
1. User registration aur login (JWT-based auth)
2. User apna task create kar sake
3. Task kisi bhi registered user ko assign ho sake
4. Task update ho sake (status, due date, description)
5. Task delete ho sake (sirf owner ya assignee)
6. User apne saare tasks list dekh sake (filter by status/due date)
7. Task create hone pe assigned user ko email notification jaye

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Response time | API response <300ms (95th percentile) |
| Concurrency | 100 concurrent users handle ho sake |
| Availability | Local/dev ke liye 99% uptime target |
| Security | Passwords hashed (bcrypt), JWT-protected routes, input sanitized |
| Scalability | Modular code taaki future mein microservices mein split ho sake |

## Architecture Style — Decision
**Chosen: Modular Monolith**

Reasoning:
- Team size chhota hai (solo project) — microservices ka overhead abhi zaroori nahi
- Modules clearly separate honge (auth, tasks, users) — future mein agar zarurat pade to alag services mein split karna easy hoga
- Fast development aur single deployment unit — learning phase ke liye best fit

## Core Entities
- **User**: name, email, password (hashed), role
- **Task**: title, description, status, dueDate, createdBy, assignedTo

## Out of Scope (v1)
- Real-time notifications (websockets) — future enhancement
- Multi-tenant support
- File attachments on tasks

## Next Steps (Day 2)
- Express project setup
- Auth routes + JWT middleware
- Tasks CRUD routes
   

   src/config/db.js — MongoDB se connect karne ka logic alag file mein rakha, taaki server.js clean rahe. mongoose.connect() ek promise return karta hai, isliye async/await use kiya.

src/server.js — ye tumhara entry point hai:

dotenv.config() — .env ki values ko process.env mein load karta hai
app.use(express.json()) — bina isके POST request ka body (req.body) undefined aayega
/api/health route — sirf ye check karne ke liye ki server chal raha hai ya nahi
DB pehle connect hoti hai, uske baad server start hota hai — warna agar DB slow ho to requests fail ho sakti hain



Ab server.js mein ye routes wire karne honge — chhota sa edit:

Edited a file, read a file
Kya samjho isme

User.js — Mongoose ka pre("save") hook — jab bhi user save hoga (register ke time), password automatically hash ho jayega. comparePassword() method login ke time plain password ko hashed wale se compare karta hai.

authController.js — generateToken() ek JWT banata hai jisme user ka id embed hota hai, 7 din ke liye valid. Register mein duplicate email check hai; login mein email + password dono match karne pe hi token milta hai.

authRoutes.js — sirf routes ko controller functions se map karta hai — clean separation.

server.js update — /api/auth/register aur /api/auth/login ab live hain.

Ab test karo:
Ye 4 files apne project mein sahi jagah copy kar do (paths waise hi rakhna)
npm run dev se server (re)start karo
Postman/Thunder Client mein test karo:
POST http://localhost:5000/api/auth/register — body: {"name":"Test","email":"test@test.com","password":"123456"}
POST http://localhost:5000/api/auth/login — same email/password se

Token wapas mile to sab sahi chal raha hai. Ho jaye to bata dena — phir