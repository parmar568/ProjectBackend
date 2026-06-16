
# 🚀 Milan Parking - Complete Deployment Guide

## 📋 Before You Start
Make sure you have these accounts ready:
1. **GitHub Account** - To host your project code
2. **Render Account** - For backend deployment (free tier available)
3. **Netlify Account** - For frontend deployment (free tier available)
4. **MongoDB Atlas** - For cloud database (or use Render's built-in database)


---

## 🗂️ Step 1: Prepare Your Project for GitHub

### 1.1 Push your code to GitHub
1. Open your terminal in the project root folder
2. Initialize git (if not already initialized):
   ```bash
   git init
   ```
3. Create a GitHub repository (public or private)
4. Add your files and commit:
   ```bash
   git add .
   git commit -m "Initial commit for deployment"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```


---

## 🔧 Step 2: Deploy Backend to Render

### 2.1 Using Render (Recommended, Super Easy!)
1. Go to [https://render.com/](https://render.com/) and log in with GitHub
2. Click **"New Web Service"**
3. Connect your GitHub account and select your milan-parking repository
4. Configure the following:
   - **Name**: milan-parking-backend
   - **Root Directory**: Leave blank (we'll use root)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: Choose the **Free** plan
5. Add these Environment Variables (click "Advanced" > "Add Environment Variable"):
   - `PORT`: `10000` (Render uses this by default)
   - `NODE_ENV`: `production`
   - `MONGO_URI`: Your MongoDB connection string (we'll set this up next)
   - `JWT_SECRET`: A random secret key (like `my_super_secret_key_12345`)
   - `GMAIL_USER`: Your Gmail address for password reset
   - `GMAIL_PASS`: Your Gmail app password (not regular password)
   - `PAYPAL_CLIENT_ID`: Your PayPal Client ID
   - `PAYPAL_CLIENT_SECRET`: Your PayPal Client Secret
   - `PAYPAL_MODE`: `sandbox` (for testing) or `live` (for production)

### 2.2 Set Up MongoDB (Optional if using Render's built-in DB)
If you want to use Render's built-in database (free):
1. In Render, click **"New +"** > **"PostgreSQL"** or **"MongoDB"** (Render now supports MongoDB Atlas integration)
2. Or use MongoDB Atlas for free:
   - Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Get your connection string, it will look like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/parkingDB?retryWrites=true&w=majority
     ```

### 2.3 Deploy!
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment to finish
3. Once deployed, copy your **Backend URL** (it will look like `https://milan-parking-backend.onrender.com`)


---

## 🎨 Step 3: Deploy Frontend to Netlify

### 3.1 Update Frontend Configuration
1. Go to your `frontend/.env.production` file
2. Update `REACT_APP_API_URL` to your Render backend URL:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```
3. Save and commit the change to GitHub!

### 3.2 Deploy to Netlify
1. Go to [https://www.netlify.com/](https://www.netlify.com/) and log in with GitHub
2. Click **"Add new site"** > **"Import an existing project"**
3. Connect your GitHub account and select your repository
4. Configure the following:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
5. Add Environment Variables (in Netlify dashboard):
   - Go to **Site settings** > **Environment variables**
   - Add `REACT_APP_API_URL` with your Render backend URL (e.g., `https://milan-parking-backend.onrender.com/api`)
6. Click **"Deploy site"**!
7. Wait for deployment to finish, then you can rename your site (e.g., `milan-parking.netlify.app`)


---

## 🔐 Step 4: Gmail App Password Setup (For Password Reset Feature)
1. Go to your Google Account: [https://myaccount.google.com/](https://myaccount.google.com/)
2. Go to **Security**
3. Enable **2-Step Verification**
4. Go to **App Passwords**
5. Select **Mail** as the app and **Other (Custom Name)** as the device (enter "Milan Parking")
6. Copy the generated password, use this as `GMAIL_PASS` in Render environment variables


---

## 🎉 Step 5: Test Your Live Site!
1. Open your Netlify frontend URL
2. Test user registration, login, parking booking
3. Test admin login (email: `admin@gmail.com`, password: `admin123`)
4. Test payment methods


---

## 💡 Important Notes
1. **Free Tier Limitations**:
   - Render free tier: Spins down after 15 minutes of inactivity (first request takes a few seconds)
   - Netlify free tier: 100GB bandwidth/month, 300 build minutes/month
2. **PayPal**: For live mode, you need to get a real PayPal Business account
3. **MongoDB**: Make sure your IP is whitelisted in MongoDB Atlas (if using it)


---

## 📞 Need Help?
Check the Render and Netlify documentation for troubleshooting:
- Render Docs: [https://render.com/docs](https://render.com/docs)
- Netlify Docs: [https://docs.netlify.com/](https://docs.netlify.com/)

