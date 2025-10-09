Noted 

---

A personal, minimal note taking app with built in features and reminders. 


<p><small><a href="https://noted-5ahw.onrender.com/" target="_blank" rel="noopener noreferrer">View demo</a></small></p>



```



            -------- # Note:  MVP hosted on Render free tier, which may take up to 50 seconds 
                                  to load initially due to server cold start. --------



✨ Features -----

       JWT Auth (Signup / Login) & Google Oauth

       Quick add (single box — first line = title, rest = content)

       Search notes with effective search bar

       Reminders via Email

       Dedicated profile, reminder, trash (30 day retention)

       Notes grid with responsive cards (dark UI)

       Edit, update, delete with ease

       Responsive — Easy drag-drop notes across all devices



🛠 ----- Tech Stack -----

       Frontend: Next.js 15 + TypeScript + Tailwind CSS

       Backend: Node.js + TypeScript + BullMQ + Passport.js

       Database: MongoDB + Mongoose + Redis 

       Auth: JWT with Google OAuth

       Deploy: Render 



⚙️ ----- Setup -----


🛠️ Local installation

download the zip file --
cd noted


-------------------------------------------------------------------


Backend (Node) --->
cd backend
npm i
# add .env from the sample below
npm run build
npm start       # start dev server (ts-node / nodemon)



backend/.env

# Server
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
BACKEND_ORIGIN=http://localhost:4000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/Noted?retryWrites=true&w=majority

# JWT & Session
JWT_SECRET=<your_jwt_secret>
SESSION_SECRET=<your_session_secret>

# Redis
REDIS_URL=redis://127.0.0.1:6379

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email@gmail.com>
SMTP_PASS=<your_app_password>
FROM_EMAIL="Noted App <your_email@gmail.com>"

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>


-------------------------------------------------------------------


Frontend (Next.js) --->
cd frontend
npm i
# create .env from the sample below
npm run build
npm run dev       # Next dev server (http://localhost:3000)



frontend/.env

NEXT_PUBLIC_API_URL=http://localhost:4000


-------------------------------------------------------------------




📝 Developed

   --  by Anurudha Sarkar  --

       Email: anurudhs567@gmail.com
  
       Portfolio: https://portfolio-kxhf.onrender.com



Thanks if you stayed till here

Happy Hacking!!




```

