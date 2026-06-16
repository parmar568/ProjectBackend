# Quick Deploy Steps - Milan Parking

## 1. Backend on Render (5 minutes)
1. Go to [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Use these settings:
   - Name: `milan-parking-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add these **Environment Variables** (copy from backend/.env):
   - `PORT`: 5000
   - `MONGO_URI`: (your MongoDB Atlas connection string)
   - `JWT_SECRET`: parking_secret_key
   - `NODE_ENV`: production
   - `GMAIL_USER`: gvp192021@gmail.com
   - `GMAIL_PASS`: mpuf iyoe owue fvcl
   - `PAYPAL_CLIENT_ID`: AUn-HuIxdIRvQvyleIUuKIVIMJFNbDnQTd2Jd0oJAV_CSi_iIPgV0LF4K5h46bX9Uj4MJ5IhgnYQDBgB
   - `PAYPAL_CLIENT_SECRET`: EAvFWML9mZ1P0oo60XE_Hlmwh9Mm0JqsxMyx6XKU8tbgKle-GFJtPPFMdLrOza6mHLWvTF6tzmhd7YfX
   - `PAYPAL_MODE`: sandbox
6. Click **"Create Web Service"**
7. Wait for deploy, copy the backend URL (like `https://milan-parking-backend.onrender.com`)

---

## 2. Frontend on Netlify (5 minutes)
1. Go to [Netlify.com](https://www.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repo
4. Use these settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
5. Click **"Deploy site"**
6. After deploy, go to **Site settings** → **Environment variables**
7. Add this variable:
   - Key: `REACT_APP_API_URL`
   - Value: (your Render backend URL + /api → like `https://milan-parking-backend.onrender.com/api`)
8. Go back to **Deploys** → Click **"Trigger deploy"** → **"Deploy site"**

---

## 3. Done!
- Your backend is on Render
- Your frontend is on Netlify
- Both work together perfectly!
