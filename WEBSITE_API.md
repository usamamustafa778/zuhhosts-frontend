# Website APIs

This document describes the **tenant website** (dashboard) APIs and the **public website** APIs used by the frontend for the branded booking site.

---

## Dashboard website APIs (authenticated)

Base path: **`/api/tenants/website`**  
All require **Bearer token** and a user with a tenant (`tenantId`).

### 1. Get website configuration

**GET** `/api/tenants/website/config`

Returns the current tenant’s public website settings and whether the plan allows toggling the site.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tenantName": "Zuha Stays",
    "slug": "zuha-stays",
    "publicUrl": "zuha-stays.zuhahost.com",
    "enabled": true,
    "canToggle": true,
    "logo": "https://...",
    "description": "...",
    "primaryColor": "#3B82F6",
    "contactEmail": "hello@example.com",
    "contactPhone": "+92 300 1234567"
  }
}
```

- **canToggle**: `true` if the subscription allows enabling/disabling the public website; `false` means “upgrade to enable”.
- **tenantName**, **slug**, **publicUrl**: For display and links.

---

### 2. Update website configuration

**PUT** `/api/tenants/website/config`  
Restricted to **owner** and **manager**.

**Body (all optional):**
```json
{
  "logo": "https://...",
  "description": "...",
  "primaryColor": "#3B82F6",
  "contactEmail": "hello@example.com",
  "contactPhone": "+92 300 1234567"
}
```

- **primaryColor**: Hex only, e.g. `#RRGGBB`. Invalid format → 400.
- **contactEmail**: Valid email or empty string to clear. Invalid → 400.
- **contactPhone**: Digits, spaces, `+ - ( )` or empty to clear. Invalid → 400.
- Omitted fields are left unchanged.

**Response (200):** Same shape as GET config (with updated values).

---

### 3. Toggle public website on/off

**POST** `/api/tenants/website/toggle`  
Restricted to **owner** (and superadmin).

**Body:**
```json
{
  "enabled": true
}
```

- **enabled**: Must be a boolean. If `true`, the API checks the subscription; if the plan does not allow public website (`publicWebsiteEnabled: false`), response is **403** with `code: "PUBLIC_WEBSITE_NOT_ALLOWED"`.
- If the user has no tenant → **403** with `code: "TENANT_REQUIRED"`.

**Response (200):**
```json
{
  "success": true,
  "message": "Public website enabled successfully",
  "data": {
    "enabled": true,
    "publicUrl": "zuha-stays.zuhahost.com"
  }
}
```

---

### 4. Website analytics (direct bookings)

**GET** `/api/tenants/website/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Query params (optional):

- **startDate**, **endDate**: ISO date strings. If omitted, last 30 days are used.
- Invalid dates or `startDate > endDate` → 400.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    },
    "summary": {
      "totalBookings": 42,
      "totalRevenue": 12500.50,
      "avgBookingValue": 297.63,
      "conversionRate": 85.5
    },
    "statusBreakdown": { "confirmed": 35, "pending": 5, "cancelled": 2 },
    "paymentBreakdown": { "paid": 30, "unpaid": 12 },
    "monthlyTrends": [
      { "month": "2025-01", "bookings": 42, "revenue": 12500.5 }
    ]
  }
}
```

- Only bookings with `source: 'direct_website'` are included.
- **monthlyTrends** is sorted by `month`.

---

## Public website APIs (no auth)

Base path: **`/public/:tenantSlug`** (e.g. `GET /public/zuha-stays/info`).  
Used by the frontend that serves the tenant’s public booking site (e.g. `{tenantSlug}.zuhahost.com`).

Tenant is resolved by **slug**; tenants with status **`active`** or **`trial`** are allowed. If the tenant’s public website is not **enabled**, endpoints return 404/403 as below.

### 1. Tenant info (for header/branding)

**GET** `/public/:tenantSlug/info`

Returns tenant name, slug, business type, country, and website block (logo, description, colors, contact).

- 404: Tenant not found or status not `active`/`trial`.
- 403: Tenant found but `publicWebsite.enabled` is false.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "name": "Zuha Stays",
    "slug": "zuha-stays",
    "businessType": "airbnb_host",
    "country": "Pakistan",
    "website": {
      "logo": "https://...",
      "description": "...",
      "primaryColor": "#3B82F6",
      "contactEmail": "hello@example.com",
      "contactPhone": "+92 300 1234567"
    }
  }
}
```

---

### 2. Public properties list

**GET** `/public/:tenantSlug/properties`

Returns properties that are **publicly visible** and have status **available** for that tenant.

**Response (200):**  
`{ "success": true, "count": N, "data": [ ... ] }`

---

### 3. Property details

**GET** `/public/:tenantSlug/properties/:propertyId`

Single property details for the public page (same visibility rules as above).

---

### 4. Availability

**GET** `/public/:tenantSlug/properties/:propertyId/availability?startDate=...&endDate=...&roomId=...`  
(or `unitId=...` for Airbnb-style)

Used for calendar and price calculation.

---

### 5. Rooms / Units

- **GET** `/public/:tenantSlug/properties/:propertyId/rooms` — hotel rooms.
- **GET** `/public/:tenantSlug/properties/:propertyId/units` — Airbnb-style units.

---

### 6. Create booking (from public site)

**POST** `/public/:tenantSlug/bookings`

Body: guest details, dates, room/unit, etc. (see public booking controller / frontend contract).  
Creates a booking with `source: 'direct_website'`.

---

## Summary

| Purpose              | Auth   | Base path                    |
|----------------------|--------|------------------------------|
| Dashboard config     | Bearer | `/api/tenants/website/*`     |
| Public booking site  | None   | `/public/:tenantSlug/*`       |

- Dashboard: **GET config**, **PUT config**, **POST toggle**, **GET analytics**.
- Public: **GET info**, **GET properties**, **GET property**, **GET availability**, **GET rooms/units**, **POST bookings**.
- Trial tenants are allowed on all public website endpoints; only `enabled` and visibility rules apply.

For subdomain and frontend wiring, see **SUBDOMAIN_SETUP_GUIDE.md** and **FRONTEND_GUIDE.md**.
