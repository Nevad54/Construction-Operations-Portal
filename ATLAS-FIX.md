# Fix MongoDB Atlas Connection

Do these in order at [cloud.mongodb.com](https://cloud.mongodb.com).

---

## 1. Network Access (allow your IP)

- Left sidebar → **Network Access**
- Click **"Add IP Address"**
- Either:
  - **"Add Current IP Address"** → Confirm  
  - Or **"Allow Access from Anywhere"** (adds `0.0.0.0/0`) → Confirm
- Wait **1–2 minutes** after saving

---

## 2. Database Access (user and password)

- Left sidebar → **Database Access**
- Find user **mtiuser** (or create one)
- Click **Edit** → **Edit Password**
- Set a password (e.g. only letters and numbers to avoid encoding issues)
- Update your project **`.env`**: replace the password in `MONGO_URI` with this password
- Save

---

## 3. Connection string in `.env`

In your project root `.env`:

```env
MONGO_URI=mongodb+srv://mtiuser:YOUR_PASSWORD@mti-cluster.ayq9k3f.mongodb.net/mti-projects?retryWrites=true&w=majority&appName=mti-cluster
```

- Replace `YOUR_PASSWORD` with the real password
- If the password has `@`, `#`, `%`, etc., URL-encode them (`@` → `%40`, `#` → `%23`)

---

## 4. Resume cluster (if paused)

- **Clusters** → your cluster (e.g. mti-cluster)
- If you see **"Resume"**, click it and wait until the cluster is running

---

## 5. Restart your backend

```powershell
cd "D:\Web App\mastertech-app"
npm run start:backend
```

You should see: **MongoDB connected successfully**
