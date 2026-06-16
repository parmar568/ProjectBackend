
# 🎨 NETLIFY PAR FRONTEND DEPLOY KARVA NI GUIDE

---

## 🟢 STEP 1: PEHLA BACKEND URL LENA (RENDER THI)
- Render par backend deploy thai gaya to, uska URL copy kar lo (e.g. `https://milan-parking-backend.onrender.com`)

---

## 🟢 STEP 2: FRONTEND CONFIG UPDATE KARO
1. Apna project ma jao, `frontend/.env.production` file open karo
2. E line replace karo:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```
   (e.g.: `REACT_APP_API_URL=https://milan-parking-backend.onrender.com/api`)
3. Aa change ne GitHub push karo!

---

## 🟢 STEP 3: NETLIFY PAR DEPLOY KARO
1. https://app.netlify.com/ open karo, GitHub ni same email thi login karo
2. **"Add new site"** → **"Import an existing project"** click karo
3. Apna repo select karo: `parmar568/ProjectBackend`
4. CONFIG FILL KARO:
   | FIELD | VALUE |
   |-------|-------|
   | **Base directory** | `frontend` |
   | **Build command** | `npm run build` |
   | **Publish directory** | `frontend/build` |
5. **Environment Variables** add karo (Site settings → Environment variables):
   - Key: `REACT_APP_API_URL`
   - Value: your full Render backend API URL (like `https://milan-parking-backend.onrender.com/api`)
6. **"Deploy site"** click karo!
7. Deploy thai gaya to site rename karo (optional), like `milan-parking.netlify.app`

---

## 🎉 TEST KARO!
- Netlify ni site open karo!
- User register, login, parking booking, admin login, badha test karo!

