# Deploy FoodHub Frontend (and Backend) Live

Follow these steps to see your app live.

---

## Updating your live app (backend + frontend already deployed)

When you change code and want the live site to reflect it:

### 1. Commit and push your changes

**Frontend (food-hub-frontend):**
```bash
cd /path/to/food-hub-frontend
git add .
git commit -m "Your update message"
git push origin main
```
*(Use your default branch name if it’s not `main`, e.g. `master`.)*

**Backend (food-hub-backend):**
```bash
cd /path/to/food-hub-backend
git add .
git commit -m "Your update message"
git push origin main
```

### 2. Let the platforms deploy

- **Vercel (frontend):** Pushing to the connected branch (usually `main`) triggers a new build and deploy. Check the **Deployments** tab in your Vercel project; when it’s “Ready”, the live site is updated.
- **Render (backend):** Pushing to the connected branch triggers a new deploy (if **Auto-Deploy** is on). Check the **Events** / **Logs** in your Render service; when the deploy finishes, the live API is updated.

### 3. If you only changed env vars

- **Vercel:** Project → **Settings → Environment Variables** → edit → **Redeploy** the latest deployment.
- **Render:** Service → **Environment** → change variables → **Save Changes**; Render will redeploy.

### 4. If you added or changed the database schema (backend)

Run migrations against the **production** database (e.g. set `DATABASE_URL` to production, then):
```bash
cd food-hub-backend
npx prisma migrate deploy
```
Then push and let Render deploy as in step 2.

---

## 1. Backend (API) – already on Render?

- If your **food-hub-backend** is already deployed on Render, note its URL, e.g.  
  `https://your-app-name.onrender.com`  
  (no trailing slash).

- If not:
  1. Push the backend repo to GitHub.
  2. In [Render](https://render.com): **New → Web Service**, connect the repo, set build command (e.g. `npm run build` or `npx prisma generate && npm run build`) and start command (e.g. `npm start`).
  3. Add **Environment Variables** in Render: `DATABASE_URL`, and any needed for auth (e.g. `APP_URL` / `APP_URLS` for your frontend URL once you have it).
  4. Deploy. After deploy, copy the **service URL** (e.g. `https://your-app.onrender.com`).

- Ensure the backend allows your frontend origin in CORS / trusted origins (e.g. your Vercel URL and `https://*.vercel.app`).

---

## 2. Frontend – deploy on Vercel

1. **Push your frontend code to GitHub** (if not already).
   ```bash
   cd /path/to/food-hub-frontend
   git add . && git commit -m "Ready for deploy" && git push
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
   - Click **Add New… → Project**, import your **food-hub-frontend** repo.
   - Leave **Framework Preset** as Next.js and **Root Directory** as `.` unless you use a monorepo.

3. **Set environment variable**
   - Before deploying, open **Environment Variables** for the project.
   - Add:
     - **Name:** `NEXT_PUBLIC_API_URL`  
     - **Value:** your backend URL, e.g. `https://your-app-name.onrender.com`  
       (no trailing slash)
   - Save.

4. **Deploy**
   - Click **Deploy**. Vercel will build and deploy. When it’s done, you’ll get a URL like `https://food-hub-frontend-xxx.vercel.app`.

---

## 3. Point backend to your live frontend (if needed)

- In your **backend** config (e.g. Render env or `.env`), set the app URL so auth and CORS work:
  - e.g. `APP_URL=https://your-vercel-app.vercel.app`  
  - or whatever variable your backend uses for allowed origins (e.g. comma-separated list).
- Redeploy the backend after changing env vars.

---

## 4. Production database

- Ensure the **production** `DATABASE_URL` in the backend points to your live DB (e.g. Supabase).
- Run migrations and (if you want) seed:
  ```bash
  npx prisma migrate deploy
  npx prisma db seed   # optional, for categories/admin/etc.
  ```
  Use the same `DATABASE_URL` as in Render (or run these from a machine that has it).

---

## 5. See it live

- Open the **Vercel URL** (e.g. `https://food-hub-frontend-xxx.vercel.app`).
- You should see the FoodHub home page; browsing meals, cart, login, etc. will call your Render backend.

**Quick checklist**

| Step | What to do |
|------|------------|
| Backend URL | Have a live backend URL (e.g. `https://xxx.onrender.com`). |
| Frontend env | In Vercel: `NEXT_PUBLIC_API_URL` = backend URL. |
| Backend CORS | Backend allows your Vercel URL (and `*.vercel.app` if needed). |
| DB | Production DB migrated (and optionally seeded). |

After that, the site is live at your Vercel URL.
