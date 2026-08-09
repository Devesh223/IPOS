# Indian Pixel OS — Production Smoke Test Checklist

Execute this verification checklist immediately after every production deployment to validate system health.

---

## 1. Automated Health & Diagnostics Ping
- [ ] Ping `/api/health` $\to$ Returns HTTP 200 with `{"status":"ok"}`.
- [ ] Run `npm run production:verify` $\to$ Returns `[PASS]` on all checks.

---

## 2. Authentication & Session Verification
- [ ] **Login:** Navigate to `/auth/login`, enter valid Super Admin credentials, verify redirection to `/dashboard`.
- [ ] **Cookie Verification:** Inspect `ip_session_token` cookie $\to$ `HttpOnly: true`, `Secure: true`, `SameSite: Lax`, `Path: /`.
- [ ] **Suspended User Rejection:** Attempt login with a suspended account $\to$ Rejected with `Invalid email or password`.
- [ ] **Brute-Force Rate Limiting:** Attempt 6 invalid logins within 60s $\to$ Blocked with rate-limit notice.
- [ ] **Logout:** Click Sign Out $\to$ Session deleted in PostgreSQL, cookie cleared, redirected to `/auth/login`.

---

## 3. Authorization & Multi-Tenant Containment
- [ ] Log in as a `CLIENT` role $\to$ Verify access restricted exclusively to assigned project and deliverables.
- [ ] Verify `CLIENT` cannot view internal cost sheets, contractor rates, or system settings.
- [ ] Verify cross-workspace ID manipulation in URL (`/projects/[foreign-id]`) triggers Authorization error boundary.

---

## 4. Financial & Invoice Engine
- [ ] Navigate to `/finance` $\to$ Invoices table renders live database records with integer paise precision.
- [ ] Click an Invoice $\to$ `/finance/invoices/[id]` renders line items, intra/inter-state GST breakdown, and payment timeline.
- [ ] Verify Payment Gate `PAY-3`: Attempt milestone completion on an overdue invoice $\to$ Blocked by domain rule.

---

## 5. File Asset & Deliverable Governance
- [ ] Navigate to `/files` $\to$ Deliverables Vault renders version history (`v1`, `v2`).
- [ ] Verify storage keys follow multi-tenant scoping: `${workspaceId}/${projectId}/deliverables/...`.
- [ ] Verify 50MB ceiling and MIME type whitelist enforcement.

---

## 6. Real-time Audit Ledger
- [ ] Navigate to `/audit` $\to$ Forensic ledger renders live immutable entries with ISO timestamps and actor IDs.
- [ ] Verify every state mutation performed during smoke testing created a corresponding audit log row.
