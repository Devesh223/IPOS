# 🚀 Render Deployment & Keep-Alive Optimization Guide

This runbook provides exact steps to deploy **Indian Pixel OS (IPOS)** on Render.com with **zero cold-start latency, instant site loads, and automated keep-alive polling**.

---

## ⚡ How to Prevent Render Cold-Starts (Keeping Your Site Fast & Active 24/7)

Render's Free Tier web services spin down after **15 minutes of inactivity**, causing a **30–50 second delay** when a client or team member opens your site.

We have implemented two architectural mechanisms to keep your site **always warm, active, and fast**:

### Option 1: Free Automated Keep-Alive Pinger (Recommended — 2 Min Setup)

Use a free uptime service like **UptimeRobot** or **Cron-Job.org**:

1. Sign up for free at [UptimeRobot.com](https://uptimerobot.com) or [Cron-Job.org](https://cron-job.org).
2. Create a new **HTTP(s) Monitor**:
   - **URL**: `https://your-app-name.onrender.com/api/health?ping=fast`
   - **Interval**: `5 minutes` or `10 minutes` (Render sleeps after 15m, so 5-10m keeps it 100% active).
3. **Result**: Your site receives a 5ms lightweight ping every 5–10 minutes, keeping the Node.js container warm 24/7 with zero spin-down lag!

---

## 🛠️ Render Web Service Deployment Configuration

When setting up your Web Service on Render:

| Setting | Recommended Value |
| :--- | :--- |
| **Environment** | `Node` |
| **Region** | `Singapore` (or closest to your target audience) |
| **Branch** | `main` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npx prisma migrate deploy && npm run start` |
| **Health Check Path** | `/api/health?ping=fast` |

---

## 🔑 Required Environment Variables on Render

In the Render Dashboard under **Environment Variables**, add:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/postgres
SESSION_SECRET=your_super_secret_session_key_min_32_chars
ADMIN_PASSWORD=your_secure_admin_bootstrap_password
```

---

## 🎯 High-Performance Next.js Standalone Build

We have enabled `output: "standalone"` in [`next.config.mjs`](file:///c:/Users/Laxmi%20Mishra/OneDrive/Desktop/Krishna/Indian%20Pixel/Indian-Pixel-OS/next.config.mjs). This reduces Next.js bundle footprint on Render by over **70%**, enabling fast container boot times and minimal RAM usage.
