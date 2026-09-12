# Indian Pixel OS — Production Deployment Runbook

This document defines the strict, authoritative, step-by-step deployment procedure for **Indian Pixel OS**.

---

## 1. Production Architecture Overview

* **Framework:** Next.js 14 (App Router)
* **Runtime:** Node.js 18+ / 20+ LTS
* **Database:** PostgreSQL on Supabase (29 normalized models)
* **ORM:** Prisma Client v5.20+
* **Authentication:** Server-authoritative scrypt hashing with random salt, HTTP-only secure session cookies
* **Hosting Platforms:** Vercel, Node.js Container, or AWS ECS/Fargate

---

## 2. Environment Contract

Configure the following environment variables in your production hosting dashboard (e.g. Vercel Project Settings):

| Variable | Purpose | Required | Scope |
| :--- | :--- | :---: | :---: |
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooled or direct) | **YES** | Server |
| `DIRECT_URL` | Direct migration database connection string (port 5432) | **YES** | Server |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL (e.g. `https://os.indianpixel.com`) | **YES** | Public |
| `SESSION_SECRET` | 32+ byte cryptographic secret for token derivation | **YES** | Server |
| `RESEND_API_KEY` | Resend transactional email API key | *Optional* | Server |
| `EMAIL_FROM` | Verified sender address (e.g. `studio@indianpixel.com`) | *Optional* | Server |
| `RAZORPAY_KEY_ID` | Razorpay Merchant Key ID | *Optional* | Server |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key for HMAC signature verification | *Optional* | Server |
| `STRIPE_SECRET_KEY` | Stripe Secret Key for global billing | *Optional* | Server |
| `PAYMENT_WEBHOOK_SECRET` | Webhook verification secret for gateways | *Optional* | Server |
| `STORAGE_BUCKET_NAME` | Cloudflare R2 / AWS S3 / Supabase Storage bucket | *Optional* | Server |
| `STORAGE_ACCESS_KEY_ID` | Object storage access key ID | *Optional* | Server |
| `STORAGE_SECRET_ACCESS_KEY` | Object storage secret key | *Optional* | Server |

> [!CAUTION]
> Never prefix sensitive credentials (`DATABASE_URL`, `SESSION_SECRET`, `RAZORPAY_KEY_SECRET`) with `NEXT_PUBLIC_`.

---

## 3. Strict Pre-Deployment Sequence

Run these verification steps locally or in CI before creating a release tag:

```bash
# 1. Verify all automated unit & integration test suites
npm test

# 2. Verify TypeScript strict type-safety
npm run typecheck

# 3. Generate Prisma client & compile production Next.js bundle
npm run build

# 4. Verify database consistency & invariant constraints
npm run db:integrity

# 5. Run pre-flight verification script
npm run production:verify
```

---

## 4. Production Deployment Execution

### Step A: Apply Database Migrations
Run Prisma migration deploy against the target database:
```bash
npm run db:migrate:deploy
```
*(Never use `npm run db:push` in production; `prisma db push` bypasses migration history).*

### Step B: Bootstrap Root Super Admin (First Launch Only)
If launching a fresh production database instance, run the idempotent bootstrap script:
```bash
ADMIN_EMAIL="admin@indianpixel.com" ADMIN_PASSWORD="SecureAdminPassword!" npm run bootstrap:admin
```
*(This script is strictly idempotent: if an admin already exists, it exits without overwriting credentials).*

### Step C: Deploy Application Artifact
Deploy the compiled bundle to Vercel or your container cluster:
```bash
# Example for Vercel CLI
vercel --prod
```

### Step D: Verify Service Health
Ping the health check endpoint:
```bash
curl -I https://os.indianpixel.com/api/health
# Expected: HTTP 200 OK with {"status":"ok","service":"indian-pixel-os"}
```

---

## 5. Post-Deployment Verification Checklist

Follow the complete verification guide in [PRODUCTION_SMOKE_TEST.md](file:///c:/Users/Laxmi%20Mishra/OneDrive/Desktop/Krishna/Indian%20Pixel/Indian-Pixel-OS/docs/PRODUCTION_SMOKE_TEST.md).
