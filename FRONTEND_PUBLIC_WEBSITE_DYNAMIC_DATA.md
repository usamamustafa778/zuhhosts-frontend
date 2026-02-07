# Frontend: Dynamic Data for Public Website

This doc is for the **frontend agent**. The backend now returns **hero image**, **testimonials**, and **amenities** in the public website API and tenant website config. Use this guide to wire the public landing page and the dashboard “Website” settings.

---

## 1. Public landing page (no auth)

### API

**GET** `/public/:tenantSlug/info`  
Base URL: your API base (e.g. `https://api.example.com` or relative `/api`).  
No auth.

### Response shape

```json
{
  "success": true,
  "data": {
    "name": "Tenant Name",
    "slug": "tenant-slug",
    "businessType": "hotel",
    "country": "...",
    "website": {
      "logo": "path-or-url",
      "description": "Welcome text...",
      "primaryColor": "#0d9488",
      "contactEmail": "contact@example.com",
      "contactPhone": "+1 234 567 8900",
      "heroImage": "website/hero.jpg",
      "testimonials": [
        {
          "quote": "An unforgettable stay...",
          "author": "Sarah M.",
          "role": "Guest",
          "stars": 5
        }
      ],
      "amenities": [
        { "label": "High-speed WiFi", "icon": "📶", "detail": "Stay connected" },
        { "label": "Parking", "icon": "🅿️", "detail": "On-site" }
      ]
    }
  }
}
```

### Using the data

| Field | Use on landing page | Fallback if missing/empty |
|-------|---------------------|---------------------------|
| `website.heroImage` | Hero/banner background image | Your default hero image |
| `website.testimonials` | Testimonials section | Your built-in placeholder testimonials |
| `website.amenities` | Amenities/features list | Your built-in default amenities |

**Images:** `logo` and `heroImage` are paths or full URLs. Resolve them the same way (e.g. existing `getImageUrl(logo)`). Use `getImageUrl(website.heroImage)` for the hero; if `heroImage` is already a full URL (starts with `http`), use as-is or pass through `getImageUrl` if it handles URLs.

**Types:**  
- `testimonials[]`: `{ quote: string, author: string, role?: string, stars?: number }` — `role` default "Guest", `stars` 1–5 default 5.  
- `amenities[]`: `{ label: string, icon?: string, detail?: string }`.

---

## 2. Dashboard: Website settings (auth)

Hosts edit website config in the dashboard. Use the tenant website config API (with auth).

### Get config

**GET** `/api/tenants/website/config`  
Auth: required (tenant user).

**Response:**

```json
{
  "success": true,
  "data": {
    "tenantName": "Tenant Name",
    "slug": "tenant-slug",
    "publicUrl": "tenant-slug.zuhahost.com",
    "enabled": true,
    "canToggle": true,
    "logo": "...",
    "description": "...",
    "primaryColor": "#3B82F6",
    "contactEmail": "...",
    "contactPhone": "...",
    "heroImage": "website/hero.jpg",
    "testimonials": [
      { "quote": "...", "author": "...", "role": "Guest", "stars": 5 }
    ],
    "amenities": [
      { "label": "...", "icon": "...", "detail": "..." }
    ]
  }
}
```

### Update config

**PUT** `/api/tenants/website/config`  
Auth: required (owner or manager).  
Body: JSON. Send only fields you are updating (partial update supported).

**Request body (all optional):**

```json
{
  "logo": "path-or-url",
  "description": "Welcome text...",
  "primaryColor": "#0d9488",
  "contactEmail": "contact@example.com",
  "contactPhone": "+1 234 567 8900",
  "heroImage": "website/hero.jpg",
  "testimonials": [
    { "quote": "The stay was great.", "author": "Jane D.", "role": "Guest", "stars": 5 }
  ],
  "amenities": [
    { "label": "High-speed WiFi", "icon": "📶", "detail": "Stay connected" }
  ]
}
```

**Validation (PUT):**

- `heroImage`: string; empty string clears it.
- `testimonials`: array. Each item must have `quote` and `author`. Optional `role` (string, default "Guest"), `stars` (number 1–5, default 5).
- `amenities`: array. Each item must have `label`. Optional `icon`, `detail` (strings).

Backend returns 400 with a message like `testimonials[0]: quote and author are required` or `amenities[1]: label is required` if validation fails.

---

## 3. Dashboard UI to implement

In the **Website** settings page (or equivalent) add:

1. **Hero image**
   - Optional “Hero image” upload (same flow as logo upload; send stored path as `heroImage` in PUT).
   - Or optional “Hero image URL” text field for external URL; send that URL as `heroImage` in PUT.
   - Show current hero (using same `getImageUrl(heroImage)` as on public page).

2. **Testimonials**
   - Section “Testimonials” with list of items.
   - Each item: quote (textarea), author (text), role (text, default “Guest”), stars (1–5, default 5).
   - Buttons: add testimonial, remove, reorder (order = array order in PUT).
   - On save, send the ordered array as `testimonials` in PUT.

3. **Amenities**
   - Section “Amenities” with list of items.
   - Each item: label (text), icon (text or emoji), detail (text).
   - Buttons: add, remove, reorder.
   - On save, send the ordered array as `amenities` in PUT.

Load current values from GET `/api/tenants/website/config` and submit changes with PUT `/api/tenants/website/config` (only changed sections or full `heroImage` / `testimonials` / `amenities` as needed).

---

## 4. Summary

| Source | Use for |
|--------|--------|
| **GET /public/:tenantSlug/info** | Public landing page: `data.website` (logo, heroImage, testimonials, amenities, etc.). Use fallbacks when a field is null/empty. |
| **GET /api/tenants/website/config** | Dashboard: load current website config including hero, testimonials, amenities. |
| **PUT /api/tenants/website/config** | Dashboard: save hero image, testimonials, amenities (and existing fields). |

All new fields are optional; missing or empty means use your existing default hero, placeholder testimonials, and default amenities on the public site.
