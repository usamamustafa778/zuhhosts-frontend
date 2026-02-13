# Custom Domain — Backend Contract

The frontend supports custom domains (e.g. `marriott.com` instead of `marriott.zuhahost.com`). The following backend API and behavior are required.

## Environment

Backend must have:

- **VERCEL_TOKEN** — Vercel API token for Domains API.
- **VERCEL_PROJECT_ID** — Vercel project id (or name) for the frontend app.

If either is missing, add/verify/remove custom domain endpoints return **503** with a clear error. Resolve-domain is unaffected (no Vercel call).

## 1. Resolve domain → tenant slug (for middleware)

**GET** `/api/tenants/resolve-domain?host={host}`  
**Auth:** None (called from Next.js middleware on every request for non-zuhahost hosts).

- **Response (200):** `{ "slug": "marriott" }` when the host is a verified custom domain for a tenant.
- **Response (404 or 4xx):** When the host is not a custom domain or not verified.
- Backend should query: `SELECT slug FROM tenants WHERE custom_domain = $1 AND custom_domain_status = 'active'` (or equivalent). Use the exact `host` from the query (no port, lowercase).

## 2. Website config includes custom domain fields

**GET** `/api/tenants/website/config` (existing)  
Include in the response (e.g. on tenant or website config):

- `customDomain` — string, e.g. `"marriott.com"`
- `customDomainStatus` — `"pending_verification"` | `"active"` | `"failed"`
- `customDomainVerificationError` — optional string (e.g. Vercel error when status is failed)

## 3. Add custom domain

**POST** `/api/tenants/website/custom-domain`  
**Body:** `{ "domain": "marriott.com" }`  
**Auth:** Required (tenant context from JWT).

1. Validate domain and tenant (e.g. one custom domain per tenant).
2. Call Vercel: `POST https://api.vercel.com/v9/projects/{projectId}/domains` with body `{ "name": "marriott.com" }` (use `VERCEL_TOKEN` and your project ID).
3. Store on tenant: `custom_domain = "marriott.com"`, `custom_domain_status = "pending_verification"`.
4. **Response (200):** `{ "customDomain": "marriott.com", "status": "pending_verification", "verificationInstructions": "..." }` (optional).

## 4. Verify custom domain

**POST** `/api/tenants/website/custom-domain/verify`  
**Auth:** Required.

1. Get tenant’s `custom_domain`; if none, return 400.
2. Call Vercel: `GET https://api.vercel.com/v9/projects/{projectId}/domains/{domain}`.
3. If `verified === true`, set `custom_domain_status = 'active'` and clear any error; else set `custom_domain_status = 'failed'` and optionally store `verification_error` from Vercel.
4. **Response (200):** `{ "customDomain": "...", "status": "active"|"pending_verification"|"failed", "verified": true|false, "verificationError": "..." }`.

## 5. Remove custom domain

**DELETE** `/api/tenants/website/custom-domain`  
**Auth:** Required.

1. Remove domain from Vercel project (DELETE domain via Vercel API if desired).
2. Clear on tenant: `custom_domain = null`, `custom_domain_status = null`, `custom_domain_verification_error = null`.
3. **Response (200):** e.g. `{ "success": true }`.

## DNS instructions (shown in frontend)

Tenants add at their DNS provider:

- **CNAME:** Name `@` or `www`, Value `cname.vercel-dns.com`
- **Or A:** Name `@`, Value `76.76.21.21`

Vercel handles SSL once the domain is verified.

## Notes

- Keep supporting `*.zuhahost.com`; custom domains are in addition.
- Only rewrite to `/public/[slug]` when `custom_domain_status = 'active'` in resolve-domain.
- Optional: support `www` by storing both root and www or by having Vercel redirect www → root.

---

## Implementation summary (backend)

Reference for what the backend implements.

### Data model (`Tenant`)

- **custom_domain** — string, nullable, trimmed/lowercased.
- **custom_domain_status** — `'pending_verification' | 'active' | 'failed'`, nullable.
- **custom_domain_verification_error** — optional string.
- Index on `(custom_domain, custom_domain_status)` for resolve-domain lookups.

### Vercel service

- **addDomain(domain)** — `POST /v9/projects/{projectId}/domains` with `{ name }`.
- **getDomain(domain)** — `GET /v9/projects/{projectId}/domains/{domain}`; returns `verified` and optional `verificationError` from `verification[0].reason`.
- **removeDomain(domain)** — `DELETE /v9/projects/{projectId}/domains/{domain}`.
- Uses `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` from env.

### Routes

- **GET /resolve-domain** registered **before** `authenticateToken` (public for Next.js middleware).
- POST/verify/DELETE custom-domain routes **after** `authenticateToken`; owner/manager (or superadmin) only in controller.

### Behavior

- **Resolve-domain:** `host` query normalized (lowercase, strip port); only returns slug when `custom_domain === host` and `custom_domain_status === 'active'`.
- **Add:** Domain validated (hostname-style), one per tenant; conflict if domain already used by another tenant; returns `verificationInstructions`.
- **Verify:** Reads Vercel project domain; sets `active` and clears error when `verified === true`, otherwise `failed` and stores verification error; 400 if no custom domain.
- **Remove:** Clears custom domain fields on tenant; attempts Vercel DELETE (best-effort); DB is always cleared; 200 `{ success: true }`.
