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

The project uses **`getImageUrl`** in **`src/lib/api.js`** (exported). It supports paths, paths starting with `/`, paths starting with `uploads/`, and full URLs (e.g. Cloudinary).

**Env:** `NEXT_PUBLIC_API_BASE_URL` (no trailing slash). Default fallback when unset on live zuhahost subdomains: `https://zuhahosts-backend.onrender.com`.

**Usage:**

```jsx
import { getImageUrl } from "@/lib/api";

// Single image
<img src={getImageUrl(property.images?.[0]) || "/placeholder.jpg"} alt={property.title} />

// Gallery (max 5)
{property.images?.map((img, i) => (
  <img key={i} src={getImageUrl(img) || "/placeholder.jpg"} alt={`${property.title} ${i + 1}`} />
))}
```

- **Empty path:** `getImageUrl` returns `null` → use a placeholder or hide the image.
- **Full URL (http/https):** returned as-is (e.g. Cloudinary).
- **Local path:** `API_BASE/uploads/...` or `API_BASE` + path when path starts with `/`.

---

## 3. Display rules

| `property.images[i]` value | Meaning              | Use in `<img src>`                    |
|---------------------------|----------------------|---------------------------------------|
| `properties/...webp`      | Path (local uploads)  | `getImageUrl(img)` → `API_BASE/uploads/properties/...` |
| `https://res.cloudinary.com/...` | Full URL (Cloudinary) | Use as-is via `getImageUrl(img)`      |

- **Max 5 images** per property.
- **Placeholder:** If `property.images` is empty or image fails to load, use a placeholder URL or `onError` fallback.

---

## 4. Create property with images (multipart)

**Endpoint:** `POST /api/properties`

Implemented in **`createProperty(data, images)`** in `src/lib/api.js`. When `images` (array of files) is provided, the client sends **multipart/form-data** (not JSON).

- **Field name:** `images` (multiple entries for multiple files).
- **Max files:** 5.
- **Allowed types:** JPEG, PNG, GIF, WEBP.

Other fields (title, description, price, currency, location, propertyType, modelType, etc.) are appended to the same FormData. Do not set `Content-Type`; the browser sets it with the multipart boundary.

---

## 5. Update property: add/remove images

**Endpoint:** `PUT /api/properties/:id`

Implemented in **`updateProperty(id, data, images, imagesToRemove)`** in `src/lib/api.js`. When adding or removing images, the client sends **multipart/form-data**.

- **New images:** append files to the `images` field (same as create). They are **added** to existing `property.images`.
- **Remove images:** send `imagesToRemove` as a **JSON string** of an array of the **exact** strings from `property.images` to remove (path or full URL).

Example – add 2 new images and remove one existing:

```js
import { updateProperty } from "@/lib/api";

await updateProperty(
  property.id,
  { title: property.title /* ... */ },
  newFileList,                    // new File[] to add
  [property.images[0]]           // exact strings from property.images to remove
);
```

**Total images** after update must still be ≤ 5: `currentImages.length - imagesToRemove.length + newFiles.length ≤ 5`.

---

## 6. Summary

| Task              | Method | Body           | Images field              |
|-------------------|--------|----------------|---------------------------|
| Display           | –      | –              | `getImageUrl(property.images[i])` from `@/lib/api` |
| Create with images| POST   | FormData       | `images`: array of files  |
| Update: add images| PUT    | FormData       | `images`: new files      |
| Update: remove    | PUT    | FormData       | `imagesToRemove`: JSON.stringify(array of exact image strings) |

Use **one source of truth** for the API base URL: **`NEXT_PUBLIC_API_BASE_URL`** (e.g. `https://zuhahosts-backend.onrender.com`). It is used in `api.js` for both API calls and `getImageUrl`.
