# Backend: Dynamic Data for Public Website

This doc describes backend changes needed so the public landing page can use **dynamic** data (banner image, testimonials, amenities) instead of hardcoded values. The frontend already uses `GET /public/:tenantSlug/info` and expects a `website` (or `websiteConfig`) object; extend that object with the fields below.

---

## 1. Current Contract (unchanged)

**GET** `/public/:tenantSlug/info` (no auth)

Response shape (keep as-is, extend `website`):

```json
{
  "success": true,
  "data": {
    "name": "Tenant Name",
    "slug": "tenant-slug",
    "businessType": "...",
    "country": "...",
    "website": {
      "logo": "path-or-url",
      "description": "Welcome text...",
      "primaryColor": "#0d9488",
      "contactEmail": "contact@example.com",
      "contactPhone": "+1 234 567 8900"
    }
  }
}
```

**GET** `/api/tenants/website/config` (auth) and **PUT** `/api/tenants/website/config` (auth) — used by the dashboard “Website” settings page. Whatever you add to the public response should be **savable** via this config endpoint so tenants can edit it.

---

## 2. New Fields to Add (website config + public response)

Add these to the **website config** entity (and expose the same in `GET /public/:tenantSlug/info` → `data.website`).

### 2.1 Hero / banner image

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `heroImage`   | string | No       | Image path (e.g. `website/hero.jpg`) or full URL for the landing page hero background. If empty, frontend uses a default image. |

- **Storage:** Same as `logo` (e.g. uploads folder, path stored in DB).
- **Dashboard:** In Website settings, add an optional “Hero image” upload (and optional “Hero image URL” for external URL).
- **Public API:** Return `website.heroImage` (resolved to full URL if path, same as logo).

---

### 2.2 Testimonials

| Field         | Type  | Required | Description |
|---------------|-------|----------|-------------|
| `testimonials`| array | No       | List of testimonial objects. If empty or missing, frontend uses default placeholder testimonials. |

**Item shape:**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `quote` | string | Yes      | The testimonial text. |
| `author`| string | Yes      | Display name (e.g. "Sarah M."). |
| `role`  | string | No       | Subtitle (e.g. "Guest"). Default: "Guest". |
| `stars` | number | No       | 1–5. Default: 5. |

**Example:**

```json
"testimonials": [
  {
    "quote": "An unforgettable stay. The rooms were immaculate...",
    "author": "Sarah M.",
    "role": "Guest",
    "stars": 5
  }
]
```

- **Storage:** JSON/JSONB column on website config, or separate `website_testimonials` table (tenant_id, sort_order, quote, author, role, stars).
- **Dashboard:** “Testimonials” section: add/remove/reorder items; fields: quote, author, role, stars.
- **Public API:** Return `website.testimonials` as array (same shape).

---

### 2.3 Amenities

| Field       | Type  | Required | Description |
|-------------|-------|----------|-------------|
| `amenities` | array | No       | List of amenity items. If empty or missing, frontend uses a default list. |

**Item shape:**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `label` | string | Yes      | Display name (e.g. "High-speed WiFi"). |
| `icon`  | string | No       | Emoji or icon key (e.g. "📶", "wifi"). Frontend can map keys to emoji. |
| `detail`| string | No       | Short line under label (e.g. "Stay connected"). |

**Example:**

```json
"amenities": [
  { "label": "High-speed WiFi", "icon": "📶", "detail": "Stay connected" },
  { "label": "Parking", "icon": "🅿️", "detail": "On-site" }
]
```

- **Storage:** JSON/JSONB on website config, or separate table with tenant_id, sort_order, label, icon, detail.
- **Dashboard:** “Amenities” section: add/remove/reorder; fields: label, icon (text/emoji), detail.
- **Public API:** Return `website.amenities` as array (same shape).

---

## 3. Summary Table

| Field          | In website config | In GET /public/:slug/info | Dashboard UI |
|----------------|-------------------|----------------------------|--------------|
| `heroImage`    | ✅                | ✅ `website.heroImage`     | Hero image upload / URL |
| `testimonials` | ✅                | ✅ `website.testimonials`  | Testimonials list (quote, author, role, stars) |
| `amenities`    | ✅                | ✅ `website.amenities`     | Amenities list (label, icon, detail) |

---

## 4. Optional (lower priority)

- **Stats** (e.g. “500+ Happy guests”, “4.9 Rating”): could add `website.stats` as array of `{ value, label }` if you want these editable. Otherwise frontend keeps current defaults.
- **Trust items** (“Best price guaranteed”, etc.): same as stats; optional `website.trustItems` or leave static.

---

## 5. Image handling (hero)

- Prefer same convention as `logo`: store path (e.g. `website/hero.jpg`) and serve via your existing uploads/base URL.
- Public API should return either:
  - full URL (if you resolve it server-side), or  
  - path that frontend can resolve with existing `getImageUrl()` (e.g. base URL + `/uploads/` + path).

Frontend already has `getImageUrl()` for logo; it will use the same for `heroImage`.

---

## 6. Backward compatibility

- All new fields are **optional**. If omitted or empty:
  - **heroImage:** frontend keeps current default hero image.
  - **testimonials:** frontend uses built-in placeholder testimonials.
  - **amenities:** frontend uses built-in default amenities list.

No breaking changes to existing clients.
