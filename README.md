# 🛡️ Indian Pixel Operating System (OS)

> **Proprietary Operating System for High-End Digital Studios & Creative Agencies.**  
> Built with Next.js 14 App Router, PostgreSQL (Supabase), Prisma ORM, scrypt Cryptography, and Integer Paise Financial Ledger.

---

## 🏛️ Core Architectural Foundations

Indian Pixel OS is engineered as a **server-authoritative, zero-trust digital agency platform** governed by strict business rules and forensic transaction logging:

1. **Authentication & Session Security:**
   - Scrypt password hashing with high work factor and cryptographically unique random salts per password (`src/lib/password.ts`).
   - High-entropy 256-bit session tokens stored in PostgreSQL with 30-day expiration and instant suspended-user lockout.
   - Strict HTTP-only, `SameSite: Lax`, and `Secure` session cookies.
   - Sliding-window in-memory rate limiting guard against brute-force login attacks (`src/lib/rate-limit.ts`).

2. **Server-Derived RBAC & Tenant Isolation:**
   - Multi-tenant workspace scoping across all 29 normalized database models.
   - Zero trust for client-supplied roles; all permissions are resolved exclusively server-side via authenticated session context (`src/lib/session.ts`).
   - Supported Global Roles: `SUPER_ADMIN`, `ADMIN`, `FINANCE`, `PROJECT_MANAGER`, `DESIGNER`, `DEVELOPER`, `FREELANCER`, `CLIENT`.

3. **Gated Delivery Engine:**
   - **Payment Gate (`PAY-3`):** Automatic moratorium on milestone task progression when prior milestone invoices are overdue.
   - **Agreement Gate (`AG-3`):** Automatic restriction blocking deliverable handoff until the client executes the Master Service Agreement (MSA).
   - **Deliverable Versioning (`D-1` / `D-3`):** Immutable version progression (`v1` $\to$ `v2` $\to$ `v3`) coupled with multi-tenant scoped object storage keys.

4. **Financial & Tax Engine:**
   - Pure integer paise monetary arithmetic with zero floating-point calculation drift.
   - Authoritative Indian GST calculation (Intra-state: 9% CGST + 9% SGST, Inter-state: 18% IGST).
   - Credit notes engine (`CN-1..CN-3`) with automatic balance adjustments and offsetting refund records.
   - Payment gateway abstraction supporting Razorpay (INR) and Stripe (Global) with constant-time HMAC-SHA256 signature verification.
   - Persistent database-level webhook idempotency (`@@unique([provider, eventId])`).

5. **Forensic Audit & Observability:**
   - Append-only immutable audit ledger coupled atomically with database transactions (`writeAuditLogEntry(..., tx)`).
   - Structured JSON logging with automatic redaction of credentials, secrets, tokens, and cookies (`src/lib/logger.ts`).
   - Request correlation tracing via `X-Request-ID` header across Next.js middleware and server actions.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- **Node.js:** `v18.17.0+` or `v20.x LTS`
- **Package Manager:** `npm`
- **Database:** PostgreSQL instance (e.g. Supabase)

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/me13krishna/Indian-Pixel-OS.git
cd Indian-Pixel-OS

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env # or configure DATABASE_URL
```

### 3. Running Locally
```bash
# Start local development server
npm run dev

# Generate Prisma Client
npm run postinstall
```

---

## 🛠️ Operational CLI Commands

| Command | Purpose |
| :--- | :--- |
| `npm test` | Run complete 17-file automated Vitest test suite (**116 tests**) |
| `npm run typecheck` | Strict TypeScript verification (`tsc --noEmit`) |
| `npm run build` | Generate Prisma client and compile production Next.js bundle |
| `npm run bootstrap:admin` | Idempotent root Super Admin and workspace provisioning |
| `npm run db:integrity` | Read-only database invariant and consistency checker |
| `npm run production:verify` | Non-destructive pre-flight / post-deployment verification script |
| `npm run db:migrate:deploy` | Apply production database schema migrations safely |

---

## 📚 Production Runbooks & Documentation

* **[Deployment Runbook](file:///c:/Users/Laxmi%20Mishra/OneDrive/Desktop/Krishna/Indian%20Pixel/Indian-Pixel-OS/docs/DEPLOYMENT.md):** Step-by-step production release guide and environment contract.
* **[Rollback & Recovery](file:///c:/Users/Laxmi%20Mishra/OneDrive/Desktop/Krishna/Indian%20Pixel/Indian-Pixel-OS/docs/ROLLBACK.md):** Application deployment rollback and Point-in-Time Recovery (PITR) procedures.
* **[Production Smoke Test](file:///c:/Users/Laxmi%20Mishra/OneDrive/Desktop/Krishna/Indian%20Pixel/Indian-Pixel-OS/docs/PRODUCTION_SMOKE_TEST.md):** Post-deployment verification checklist.
* **[Operations & Backups](file:///c:/Users/Laxmi%20Mishra/OneDrive/Desktop/Krishna/Indian%20Pixel/Indian-Pixel-OS/docs/OPERATIONS_BACKUP_RECOVERY.md):** Supabase backups, webhook replays, and provider incident handling.

---

## 📊 Verification Baseline

* **Automated Tests:** 🟢 `116 / 116 PASS` (17 test files)
* **TypeScript Compilation:** 🟢 `0 Errors` (`tsc --noEmit`)
* **Production Routes:** 🟢 `25 / 25 Compiled` (`prisma generate && next build`)
* **Database Invariants:** 🟢 `7 / 7 Invariants PASS`
* **Release Status:** 🟢 `READY FOR PRODUCTION DEPLOYMENT`