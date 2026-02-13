# Connect Your Atlas Cluster to Compass + Web App

Use the same cluster for both. Do **Step 1** and **Step 2** once in Atlas; then use the connection string in Compass and in your app.

---

## Step 1: Allow connections (Network Access)

Your cluster blocks all IPs until you allow them.

1. Go to **[cloud.mongodb.com](https://cloud.mongodb.com)** → your project.
2. Left sidebar → **Network Access**.
3. Click **"Add IP Address"**.
4. Choose one:
   - **"Add Current IP Address"** (recommended) → **Confirm**
   - Or **"Allow Access from Anywhere"** (`0.0.0.0/0`) → **Confirm**
5. Wait **1–2 minutes** for it to take effect.

Without this, neither Compass nor the web app can reach the cluster.

---

## Step 2: Check database user and password

1. Left sidebar → **Database Access**.
2. Find user **mtiuser** (or the user in your connection string).
3. If needed: **Edit** → **Edit Password** → set a password you’ll use everywhere (e.g. only letters/numbers).
4. Your **connection string** uses: `mtiuser` and this password.

---

## Step 3: Get your connection string

1. In Atlas: **Database** → your cluster (**mti-cluster**) → **Connect**.
2. Choose **"Connect using MongoDB Compass"**.
3. Copy the URI. It looks like:
   ```text
   mongodb+srv://mtiuser:<password>@mti-cluster.ayq9k3f.mongodb.net/?appName=mti-cluster
   ```
4. Replace **`<password>`** with the real password (e.g. `1111`).  
   If the password has `@`, `#`, `%`, encode them: `@` → `%40`, `#` → `%23`, `%` → `%25`.

---

## Connect to Compass

1. Open **MongoDB Compass**.
2. In the connection field, paste the **full** connection string (with `<password>` replaced).
3. Optional: add the database name before the `?` so it opens that DB:
   ```text
   mongodb+srv://mtiuser:1111@mti-cluster.ayq9k3f.mongodb.net/mti-projects?appName=mti-cluster
   ```
4. Click **Connect**.

If it fails: double-check **Step 1** (Network Access) and **Step 2** (user/password).

---

## If Compass connection fails

**1. Fix Atlas Network Access (most common)**  
- Atlas → **Network Access** → **Add IP Address** → **"Allow Access from Anywhere"** (`0.0.0.0/0`) → Confirm.  
- Wait **2–3 minutes**, then try Compass again.

**2. Try a simpler URI in Compass**  
Paste this and click Connect (use your real password):
```text
mongodb+srv://mtiuser:1111@mti-cluster.ayq9k3f.mongodb.net/?appName=mti-cluster
```
Then in Compass you can open the `mti-projects` database from the sidebar.

**3. Reset the database user password**  
- Atlas → **Database Access** → **mtiuser** → **Edit** → **Edit Password**.  
- Set a **new** password (letters and numbers only, e.g. `AtlasPass123`).  
- Use that **exact** password in the URI (replace `1111` in the string above).  
- No spaces; copy-paste the password.

**4. Check the cluster is running**  
- Atlas → **Database** → your cluster.  
- If it says **Paused**, click **Resume** and wait until it shows **Active**.

**5. Note the exact error from Compass**  
- **"Authentication failed"** → wrong username or password (do step 3).  
- **"Connection timeout" / "ECONNREFUSED"** → IP not allowed or network block (do step 1; try another network or turn off VPN).

---

## Connect the web app

Your app already uses the same cluster via `.env`:

- File: **`.env`** in the project root.
- Line: **`MONGO_URI=mongodb+srv://mtiuser:1111@mti-cluster...`**

Do this:

1. Make sure the password in **`.env`** matches the Atlas user password (same as in Compass).
2. Start (or restart) the **backend**:
   ```powershell
   cd "D:\Web App\mastertech-app"
   npm run start:backend
   ```
3. In the terminal you should see **"MongoDB connected successfully"**.
4. Open the app at **http://localhost:3000** and check the Projects page.

---

## One connection string, two places

| Use            | Where to put it |
|----------------|------------------|
| **Compass**    | Paste in Compass connection field (with password filled in). |
| **Web app**    | Already in `.env` as `MONGO_URI`. Restart backend after any change. |

Same cluster, same user/password: fix **Network Access** and **Database Access** once, then use that connection string in both Compass and the web app.
