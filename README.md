

Noted

---

   A personal, minimal note takign app with in built reminder system, leveraging Node with BullMQ for backend developement & 
        for frontend utilizing Next.js with Tailwind for frontend and ensuring typesafety with TypeScript.


```



         -------- # Note:  MVP hosted on Render free tier, which may take up to 50 seconds 
                                  to load initially due to server cold start. --------



✨ Features -----

       JWT Auth (Signup / Login) & Google Oauth

       Quick add (single box — first line = title, rest = content)

       Search notes with effective search bar

       Get reminders via Email

       Notes grid with responsive cards (dark UI)

       Edit, update, delete with ease

       Responsive — consistent UI across all devices



🛠 ----- Tech Stack -----

       Frontend: Next.js 15 + TypeScript + Tailwind CSS

       Backend: Node.js + TypeScript + BullMQ

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

PORT=4000
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
FRONTEND_ORIGIN=http://localhost:3000


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


Production / Deploy
Deploy backend (Render / any Node host)


Next frontned ----------->


Build command: npm install && npm run build
Start command: npm start
NEXT_PUBLIC_API_URL:https:/<your_api_url>.com     --- the deployed frontend url


Start command: npm start (use render or vercel for easy frontend hosting)
Build command: npm i && npm run build



Node backend ----------->

MONGODB_URI=<your_mongo_uri>
JWT_SECRET=<your_jwt_secret>
PORT=<your_port> || 5000
FRONTEND_ORIGIN=https:/<your_client_url>.com      --- the deployed frontend url


Start command: npm start (use render or vercel for easy frontend hosting)
Build command: npm i && npm run build



📝 Developed

   --  by Anurudha Sarkar  --



```

       Email: anurudhs567@gmail.com
  
       Portfolio: https://portfolio-kxhf.onrender.com


tell me the difficulty level of the app and is this suitable for freshers or ecperienced. And tellme complete use flow of the app
