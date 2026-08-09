# Indian Pixel OS — Production Backup, Recovery & Operational Procedures

This document outlines the authoritative operational procedures for database backups, disaster recovery, migration deployment, failed payment reconciliation, and webhook replay.

---

## 1. Database Backup & PITR Architecture (Supabase / PostgreSQL)

### Managed Backup Strategy
* **Daily Automated Physical Backups:** Managed by Supabase infrastructure with 30-day retention for production instances.
* **Point-in-Time Recovery (PITR):** Write-Ahead Logs (WAL) continuously stream to secure object storage allowing recovery to any specific second within the retention window.

### Manual Snapshot Trigger (Pre-Major Release)
Before performing major schema migrations or critical data restructuring, execute a logical dump:
```bash
# Export schema + data to compressed dump
pg_dump -h db.aerowmzpmucbyjfxmlfj.supabase.co -U postgres -d postgres -F c -b -v -f "backup_indianpixel_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 2. Production Deployment & Migration Sequence

### Strict Operational Order:
1. **Build Verification:** Run `npm test` and `npm run typecheck`.
2. **Compile Assets:** `npm run build` (triggers `prisma generate` and Next.js optimization).
3. **Database Migration:** Run `npm run db:migrate:deploy` (`prisma migrate deploy`) against the target database.
4. **Bootstrapping (First Launch Only):** Run `npm run bootstrap:admin` to ensure root Super Admin and initial workspace are provisioned idempotently.
5. **Integrity Verification:** Run `npm run db:integrity` to confirm database invariants before opening traffic.
6. **Live Routing:** Shift traffic to new deployment artifact.

---

## 3. Disaster Recovery & Rollback Procedure

### Scenario A: Application Rollback (Zero DB Migration)
If a runtime bug or UI fault occurs without schema changes:
1. Roll back deployment to the previous verified Git commit tag on Vercel/Node host.
2. Invalidate server-side caches.
3. No database restoration required.

### Scenario B: Database Rollback (Data Recovery)
If unintended data corruption occurs:
1. Place the application in Maintenance Mode via edge router / DNS.
2. Execute Supabase Point-in-Time Recovery to the timestamp immediately preceding the incident:
   * Target timestamp: `YYYY-MM-DDTHH:MM:SSZ`
3. Verify database consistency using `npm run db:integrity`.
4. Check recent audit entries in `audit_log_entries` to reconcile external payment states.
5. Restore traffic.

---

## 4. Payment & Webhook Failure Reconciliation

### Failed Webhook Delivery / Gateway Outage:
* **Idempotency Guarantee:** All webhooks record `[provider, eventId]` in `PaymentWebhookEvent`.
* **Replay Safety:** In the event of network dropouts or gateway retries, replaying webhook events from the Razorpay or Stripe dashboard will **never** generate duplicate financial entries (`Rule PAY-4`).
* **Manual UTR Reconciliation:** If a client paid via direct bank wire (NEFT/RTGS/IMPS), finance officers can reconcile the payment through the `/finance` dashboard using the verified bank UTR number, immediately generating an immutable audit trail entry.

---

## 5. File Asset & Object Storage Preservation

* All project deliverables and assets are stored with deterministic multi-tenant namespaces (`${workspaceId}/${projectId}/...`).
* File deletions in Indian Pixel OS are **non-destructive** (`isArchived: true` flag in PostgreSQL `files` table).
* Deleting a project or milestone archives assets while preserving historical deliverable version hashes.
