# Tenant setup – "User is not associated with a tenant"

This guide explains the **TENANT_REQUIRED** error and how to resolve it.

---

## The error

When calling tenant-scoped APIs (housekeeping, properties, bookings, tenant website config, etc.), the API may return:

**HTTP status:** `403 Forbidden`

**Response body:**
```json
{
  "success": false,
  "message": "User is not associated with a tenant. Please complete tenant setup first.",
  "code": "TENANT_REQUIRED"
}
```

---

## What it means

- The user is **logged in** (valid JWT).
- The user has **no tenant** (`user.tenantId` is null).
- The requested endpoint requires a tenant (e.g. housekeeping, properties, bookings).

This typically happens for:

1. **Users created before V2** – old accounts had no Tenant or `tenantId`.
2. **Legacy or migrated users** – data existed before the tenant model was introduced.
3. **Edge cases** – user record was created without going through the current register flow that creates a Tenant.

---

## How to fix it

### Option 1: Tenant setup endpoint (recommended for existing users)

Have the user complete **tenant setup** once. The backend provides:

**Endpoint:** `POST /api/tenants/setup`  
**Auth:** Required (Bearer token)

**Request body (all optional):**
```json
{
  "name": "My Hotel",
  "country": "Pakistan",
  "businessType": "hotel"
}
```

| Field         | Type   | Description                                      |
|---------------|--------|--------------------------------------------------|
| `name`        | string | Tenant/business name. Default: `"{user.name}'s Business"` |
| `country`     | string | Default: `"Pakistan"`                            |
| `businessType` | string | `"hotel"`, `"airbnb"` (stored as `airbnb_host`), or `"both"`. Default: `"hotel"` |

**Success response (201):**
```json
{
  "success": true,
  "message": "Tenant created successfully. You can now use all features.",
  "data": {
    "tenant": {
      "id": "...",
      "name": "My Hotel",
      "slug": "my-hotel",
      "businessType": "hotel",
      "country": "Pakistan",
      "status": "trial"
    },
    "subscription": {
      "id": "...",
      "package": "free_trial",
      "status": "trial",
      "trialEndsAt": "...",
      "maxProperties": 5
    },
    "user": {
      "id": "...",
      "tenantId": "...",
      "roleType": "owner"
    }
  }
}
```

After a successful setup, the user has a tenant and can use all tenant-scoped APIs. You may want to refresh the stored user object (e.g. from login/setup response) so the frontend has the new `tenantId` and `roleType`.

---

### Option 2: One-off migration (backend)

For many existing users, you can run a **one-off script** that:

1. Finds users where `tenantId` is null and `roleType` is not `superadmin`.
2. For each user, creates a Tenant (and optionally a Subscription), then sets `user.tenantId` and `user.roleType = 'owner'`.

This is backend-only and does not require users to hit the setup endpoint.

---

## Frontend handling

1. **Detect the error**  
   On tenant-scoped API calls, check for:
   - status `403` and  
   - body `code === 'TENANT_REQUIRED'`.

2. **Redirect to tenant setup**  
   Show a “Complete your business setup” (or similar) step:
   - Single form: business name, country, type.
   - On submit, call `POST /api/tenants/setup` with the form data.

3. **After successful setup**  
   - Update local user state with the returned `user` (including `tenantId`, `roleType`).
   - Redirect to dashboard (or retry the original request).

**Example (pseudo-code):**
```javascript
// After any tenant-scoped API call
if (response.status === 403 && response.data?.code === 'TENANT_REQUIRED') {
  redirectTo('/onboarding/tenant-setup');
  return;
}

// On tenant setup page submit
const res = await api.post('/api/tenants/setup', { name, country, businessType });
if (res.data.success) {
  updateUser(res.data.data.user);
  redirectTo('/dashboard');
}
```

---

## Endpoints that require a tenant

These (and other tenant-scoped routes) return **403** with **TENANT_REQUIRED** when `user.tenantId` is null:

- `GET/POST/PATCH/DELETE` `/api/housekeeping/*`
- `GET/POST/PUT/DELETE` `/api/properties/*`
- `GET/POST/PUT/DELETE` `/api/bookings/*`
- `GET/POST/PUT/DELETE` `/api/guests/*`
- `GET/PUT` `/api/tenants/website/config`
- `POST` `/api/tenants/website/toggle`
- Tenant analytics, tasks, etc.

---

## Who does not need tenant setup?

- **New signups** – Register flow creates a Tenant and sets `user.tenantId` and `user.roleType: 'owner'`, so they never see TENANT_REQUIRED from the start.
- **Superadmin** – Platform admin; may have no `tenantId` and use different (superadmin) endpoints.

---

## Still getting the error?

If you already tried tenant setup and **GET /api/housekeeping/tasks** (or other tenant APIs) still return `TENANT_REQUIRED`:

1. **Same user, same token**  
   `POST /api/tenants/setup` must be called with the **same** JWT you use for housekeeping. If you use a different account or token, that user still has no tenant.

2. **Call setup once per account**  
   In Postman/Thunder Client: send **POST** `http://localhost:5001/api/tenants/setup` with header `Authorization: Bearer <your_login_token>`. Then call **GET** `/api/housekeeping/tasks` again with the same token.

3. **Fix all existing users in the DB (migration)**  
   From the project root, run:
   ```bash
   node scripts/migrate-users-to-tenants.js
   ```
   This creates a tenant for every user who has no `tenantId` and sets them as owner. After it runs, housekeeping (and other tenant APIs) will work for those users without calling the setup endpoint. Requires `MONGODB_URI` in `.env`.

---

## Summary

| Situation                         | Action |
|----------------------------------|--------|
| Existing user, no tenant         | Call `POST /api/tenants/setup` (or run migration). |
| New user                         | No action; register already creates tenant. |
| Frontend gets 403 + TENANT_REQUIRED | Redirect to tenant-setup step, then retry or go to dashboard. |
| Still 403 after setup            | Use same token for setup and housekeeping; or run `node scripts/migrate-users-to-tenants.js`. |
