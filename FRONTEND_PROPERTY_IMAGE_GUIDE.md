# Property images – frontend implementation guide

How to display and upload property images when talking to this API.

---

## 1. API shape

Property responses include an `images` array of strings:

```json
{
  "id": "...",
  "title": "My Property",
  "images": [
    "properties/propertyImages-1770449800029-486835147.webp",
    "https://res.cloudinary.com/your-cloud/image/upload/v123/zuhahosts/properties/xxx.jpg"
  ]
}
```

Each item is **either**:

- A **path** (no `http`): relative to the API’s `/uploads` folder, e.g. `properties/propertyImages-xxx.webp`.
- A **full URL** (starts with `http`): e.g. Cloudinary. Use as-is for `<img src>`.

---

## 2. Resolving the image URL (getImageUrl)

**In this project** we use **`getImageUrl`** from **`src/lib/api.js`** (see also RENDER_UPLOADS.md). It supports:

- **Full URL** (starts with `http`/`https`): returned as-is (e.g. Cloudinary).
- **Path** (e.g. `properties/propertyImages-xxx.webp`): returns `{API_BASE_URL}/uploads/{path}`.
- Paths starting with `/` or `uploads/` are normalized so there is no double `/uploads/`.

**Env:** `NEXT_PUBLIC_API_BASE_URL` (no trailing slash). Fallback when unset on live zuhahost subdomains: `https://zuhahosts-backend.onrender.com`.

**Usage:**

```jsx
import { getImageUrl } from "@/lib/api";

// Single image (use placeholder when null)
<img src={getImageUrl(property.images?.[0]) || "/placeholder.jpg"} alt={property.title} />

// Gallery (max 5)
{property.images?.map((img, i) => (
  <img key={i} src={getImageUrl(img) || "/placeholder.jpg"} alt={`${property.title} ${i + 1}`} onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }} />
))}
```

---

## 3. Display rules

| `property.images[i]` value | Meaning              | Use in `<img src>`                    |
|---------------------------|----------------------|---------------------------------------|
| `properties/...webp`      | Path (local uploads) | `getImageUrl(img)` → `API_BASE/uploads/properties/...` |
| `https://res.cloudinary.com/...` | Full URL (Cloudinary) | `getImageUrl(img)` returns as-is     |

- **Max 5 images** per property.
- **Placeholder:** If `property.images` is empty or image fails (e.g. 404 on Render), use a placeholder or `onError` on `<img>` (see RENDER_UPLOADS.md).

---

## 4. Create property with images (multipart)

**Endpoint:** `POST /api/properties`

Send **multipart/form-data** (not JSON). Include image files under the field `images` (array).

- **Field name:** `images`
- **Max files:** 5
- **Allowed types:** JPEG, PNG, GIF, WEBP

Example (fetch):

```js
const formData = new FormData();
formData.append('title', 'Beach House');
formData.append('description', '...');
formData.append('price', '150');
formData.append('currency', 'USD');
formData.append('location', 'Miami');
// ... other fields (propertyType, modelType, bedrooms, bathrooms, area, status)

// Append image files (same field name for multiple)
files.forEach((file) => formData.append('images', file));

const res = await fetch(`${API_BASE_URL}/api/properties`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    // Do NOT set Content-Type; browser sets multipart boundary
  },
  body: formData,
});
const property = await res.json();
// property.images will be paths or full Cloudinary URLs
```

---

## 5. Update property: add/remove images

**Endpoint:** `PUT /api/properties/:id`

Also **multipart/form-data** when you send new images.

- **New images:** append files to the `images` field (same as create). They are **added** to existing `property.images`.
- **Remove images:** send `imagesToRemove` with the **exact** string values from `property.images` that you want to remove (path or full URL).

Example – add 2 new images and remove one existing:

```js
const formData = new FormData();
formData.append('title', property.title);
// ... other fields you want to update

// Remove specific image(s) – use the exact value from property.images
formData.append('imagesToRemove', JSON.stringify([
  property.images[0]  // e.g. "properties/..." or "https://res.cloudinary.com/..."
]));

// New files to add
newFileList.forEach((file) => formData.append('images', file));

const res = await fetch(`${API_BASE_URL}/api/properties/${property.id}`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

**Total images** after update must still be ≤ 5. So: `currentImages.length - imagesToRemove.length + newFiles.length ≤ 5`.

---

## 6. Summary

| Task              | Method | Body           | Images field              |
|-------------------|--------|----------------|---------------------------|
| Display           | –      | –              | `getImageUrl(property.images[i])` from `@/lib/api` |
| Create with images| POST   | FormData       | `images`: array of files  |
| Update: add images| PUT    | FormData       | `images`: new files       |
| Update: remove    | PUT    | FormData       | `imagesToRemove`: JSON.stringify(array of exact image strings) |

Keep **one source of truth** for the API base URL: **`NEXT_PUBLIC_API_BASE_URL`** (e.g. `https://zuhahosts-backend.onrender.com`). It is used in `src/lib/api.js` for both API calls and `getImageUrl`.

---

## 7. Why images work on localhost but not on live (e.g. marriot-s-business.zuhahost.com)

- **Live:** Image URL like `https://zuhahosts-backend.onrender.com/uploads/properties/propertyImages-xxx.webp` returns 404 because the file **does not exist** on Render (ephemeral disk). So images don't show.
- **Local:** `http://localhost:5001/uploads/properties/...` works because the file exists in the backend's `uploads/` folder.

**Fix:** Backend must use Cloudinary on Render — see **RENDER_UPLOADS.md**. Then **re-upload** each property's images on the live app so the API stores full Cloudinary URLs. Frontend already uses `getImageUrl` (path → `API_BASE/uploads/...`, full URL as-is); once backend returns Cloudinary URLs, images display on live. Use a **placeholder** or **`onError`** on `<img>` when the image fails (e.g. 404 for old disk paths).

**See also:** **RENDER_UPLOADS.md** — why Render returns 404 for `/uploads/` and how Cloudinary fixes it. Implementation: **`getImageUrl`** in **`src/lib/api.js`**.
