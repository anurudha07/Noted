 LeadQ

---


```


## Project Overview
LeadQ is a full-stack web app for scoring leads using rule-based logic + AI reasoning. 
Backend: Node.js + Express + Prisma + PostgreSQL + Gemini AI.
Frontend: Next.js + TailwindCSS.

## Features
- Add product/offers
- Upload CSV leads
- Score leads (High/Medium/Low) with AI
- Results dashboard with filters, charts, CSV export
- Authentication for dashboard

## Setup Instructions

### Backend
1. `cd backend`
2. `npm install`
3. Copy `.env.example` → `.env`
4. `npm run prisma:migrate`
5. `npm run dev` (dev mode)

### Frontend
1. `cd frontend`
2. `npm install`
3. Copy `.env.local.example` → `.env.local` (add backend URL)
4. `npm run dev`

### Deployment
- Backend: Render / Railway / Heroku
- Frontend: Vercel / Netlify

## API Endpoints
- `POST /offer` → Add offer
- `POST /leads/upload` → Upload CSV
- `POST /score/run` → Score leads
- `GET /results` → Get scored leads



```
