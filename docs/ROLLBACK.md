# Indian Pixel OS — Production Rollback & Recovery Guide

This runbook defines the emergency operational procedure for rolling back application code and recovering database state in the event of a deployment failure.

---

## 1. Application-Only Rollback (No Schema Migration)

If a production defect is isolated to frontend code, UI rendering, or server action logic without database schema modifications:

### Execution on Vercel:
1. Navigate to **Deployments** in the Vercel Dashboard.
2. Locate the previous healthy deployment commit tag.
3. Click **Instant Rollback** / **Promote to Production**.
4. Traffic shifts instantly with zero downtime.

### Execution on Self-Hosted / Docker:
1. Re-deploy the previously verified Docker image tag:
   ```bash
   docker pull ghcr.io/me13krishna/indian-pixel-os:previous-commit-sha
   docker stop indian-pixel-os && docker rm indian-pixel-os
   docker run -d --name indian-pixel-os -p 3000:3000 --env-file .env.production ghcr.io/me13krishna/indian-pixel-os:previous-commit-sha
   ```

---

## 2. Database Migration Rollback & Forward-Fix Strategy

### The Forward-Fix Rule (Recommended)
Prisma migrations cannot always be cleanly reversed automatically without data loss. If a schema migration deployed a defect:
1. **Never** run `prisma db push --force-reset` in production.
2. Develop an additive corrective migration:
   ```bash
   npx prisma migrate dev --name fix_erroneous_column
   ```
3. Test locally and deploy via `npm run db:migrate:deploy`.

### Severe Data Corruption: Point-in-Time Recovery (PITR)
If data corruption occurred:
1. Place the application in **Maintenance Mode** via edge router.
2. Open the **Supabase Dashboard** $\to$ **Database** $\to$ **Backups** $\to$ **Point-in-Time Recovery**.
3. Select the timestamp immediately prior to the incident (e.g. `2026-08-09T06:00:00Z`).
4. Execute restore.
5. Run the read-only integrity checker to confirm recovery:
   ```bash
   npm run db:integrity
   ```
6. Lift Maintenance Mode.

---

## 3. Webhook Replay & Reconciliation Post-Recovery

If the database was restored to a previous timestamp:
1. Any incoming payments captured during the outage window will have webhook retries from Razorpay or Stripe.
2. Replaying webhooks from the gateway dashboard is **strictly idempotent** (`PaymentWebhookEvent` table prevents duplicate credit entries).
3. Review `/finance` to confirm bank UTR reconciliations match bank statements.
