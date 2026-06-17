# 🚀 Production Deployment Checklist (Render)

---

## 🟢 BEFORE YOU DEPLOY
1. ✅ MongoDB Atlas Cluster Created & Configured
2. ✅ MongoDB Atlas IP Whitelist Includes `0.0.0.0/0` (or Render's outbound IPs)
3. ✅ MongoDB Connection String Created
4. ✅ Environment Variables Ready (see below)

---

## 🟢 RENDER ENVIRONMENT VARIABLES TO SET

Go to Render → Your Backend Service → Environment:

| Key | Value | Required |
|-----|-------|----------|
| `MONGO_URI` | `mongodb+srv://milanparmar568_db_user:KGjYV47p4Rhr7OPG@cluster0.3shn8zb.mongodb.net/parkingDB?appName=Cluster0` | YES 🔴 |
| `PORT` | `10000` | YES 🔴 |
| `NODE_ENV` | `production` | YES 🔴 |
| `JWT_SECRET` | `some-random-secret-key-here-change-this!` | YES 🔴 |
| `GMAIL_USER` | `your-email@gmail.com` | For password reset |
| `GMAIL_PASS` | `gmail-app-password-here` | For password reset |
| `PAYPAL_CLIENT_ID` | `your-paypal-client-id-here` | For payments |
| `PAYPAL_CLIENT_SECRET` | `your-paypal-client-secret-here` | For payments |
| `PAYPAL_MODE` | `sandbox` OR `live` | For payments |

---

## 🟢 HOW TO DEPLOY ON RENDER

1. Go to https://dashboard.render.com/
2. Open your backend service: `projectbackend-qcf8`
3. Click **Manual Deploy** (top right)
4. Select **Deploy latest commit**
5. Wait ~2 minutes
6. Check **Logs** to verify:
   ```
   ✅ MongoDB Connected Successfully: ...
   ✅ Server running in production mode on port 10000
   ✅ Default admin created/already exists
   ✅ Status normalization migrations completed!
   ✅ Cron job started successfully!
   ```

---

## 🟢 TEST YOUR BACKEND

Open your backend URL: https://projectbackend-qcf8.onrender.com/health

You should see:
```json
{
  "success": true,
  "message": "Backend is healthy and running!",
  "dbConnected": true,
  "timestamp": "2026-06-17T..."
}
```

---

## 🟢 NETLIFY FRONTEND UPDATE

1. Go to your Netlify site
2. Go to **Site settings** → **Environment variables**
3. Set `REACT_APP_API_URL` to `https://projectbackend-qcf8.onrender.com/api`
4. Go to **Deploys** → **Trigger deploy** → **Deploy site**
5. Wait ~1 minute
6. Open your Netlify site!

---

## 🟢 AFTER DEPLOYMENT

1. ✅ Test user registration/login
2. ✅ Test parking booking
3. ✅ Test admin login (`admin@gmail.com` / `admin123`)
4. ✅ Test payments (if configured)
5. ✅ Test password reset (if Gmail config is set)
