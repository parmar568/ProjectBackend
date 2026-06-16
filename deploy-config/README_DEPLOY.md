# Deployment Instructions

## Frontend (Netlify)
1. Go to Netlify.
2. Select your repository.
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `frontend/build`
5. Add environment variable: `REACT_APP_API_URL` = (Your Backend URL)/api

## Backend (Render / Railway)
1. Go to Render.com.
2. Create a new Web Service.
3. Set **Root Directory**: `backend` (or leave empty if using root `package.json`).
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Connection String
   - `PORT`: 5000
   - `NODE_ENV`: production

## Mobile Responsiveness
The admin sidebar now automatically collapses on mobile and a toggle button has been added to the Topbar.
User navigation also uses a hamburger menu for mobile devices.
