Noted

A personal, minimal note app built with Next.js + TypeScript + Tailwind (frontend) and Node + TypeScript + MongoDB (backend). Fast, user friendly, and mobile-first.

```
About

Noted is a lightweight, responsive, secure note-taking app designed for quick capture and focused reading. Inspired by minimal UIs and keyboard-first workflows.


Features

🔐 JWT Auth (Signup / Login)
📝 Quick add (single box — first line = title, rest = content)
🗄️ Notes grid with responsive cards (dark UI, small text)
✏️ Edit with ease
🔎 Search notes 
📱 Responsive — consistent sidebar on mobile & desktop
🧭 Stay focused increasing productivity with minimalistic UI


Tech Stack

Frontend: Next.js + TypeScript + Tailwind CSS
Backend: Node.js + TypeScript + MongoDB 
Auth: JWT
Deploy: Render + static host


Usage

- Create quick note → first line becomes title, rest becomes content

- Click a note to edit (modal opens, background blurs)

- Use more menu to delete a note

- Search for notes with top search bar

- Works across all devices


Getting started
🛠️ Local installation

download the zip file --
cd noted


-------------------------------------------------------------------


Backend --->
cd backend
npm i
# add .env from the sample below
npm run build
npm start       # start dev server (ts-node / nodemon)



backend/.env

PORT=4000
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
# optional
NODE_ENV=development


-------------------------------------------------------------------


Frontend (Next.js)
cd frontend
npm i
# create .env from the sample below
npm run build
npm run dev        # Next dev server (http://localhost:3000)



frontend/.env

NEXT_PUBLIC_API_URL=http://localhost:4000


-------------------------------------------------------------------


Production / Deploy
Deploy backend (Render / any Node host)


Next frontned ----------->


Build command: npm install && npm run build

Start command: npm start

NEXT_PUBLIC_API_URL:https:/<your_api_url>.com



Node frontned ----------->

FRONTEND_ORIGIN=https:/<your_client_url>.com

MONGODB_URI=<your_mongo_uri>

JWT_SECRET=<your_jwt_secret>

PORT=<your_port> || 5000


Start command: npm start (or use Vercel for easiest Next.js hosting)
Build command: npm i && npm run build




```

Developed by
— Anurudha /  —

Email: anurudhs567@gmail.com

Portfolio: https://portfolio-kxhf.onrender.com

