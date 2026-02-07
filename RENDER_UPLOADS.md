# Uploads on Render (why images work locally but not on live)

## What’s going on

- **Local:** Uploaded files are saved to `uploads/` on your machine and stay there. So `http://localhost:5001/uploads/properties/...` works.
- **Render:** The app runs in a **container with an ephemeral filesystem**. Anything written to disk (e.g. `uploads/properties/propertyImages-....webp`) is **lost** when:
  - The service restarts (e.g. after a new deploy),
  - The free-tier instance spins down and comes back up,
  - The container is recreated for any reason.

So on live, when the browser requests:

`https://zuhahosts-backend.onrender.com/uploads/properties/propertyImages-1770449800029-486835147.webp`

the file is not there. The request hits the `/uploads` static middleware, no file is found, and the app falls through to the 404 handler, which returns:

`{"success":false,"message":"Route not found"}`

So the image path/URL format is correct; the file simply doesn’t exist on Render’s disk.

---

## Why images still don't show on live (e.g. marriot-s-business.zuhahost.com)

- **Live image URL** like `https://zuhahosts-backend.onrender.com/uploads/properties/propertyImages-xxx.webp` — that file **does not exist** on Render (ephemeral disk). Backend returns 404 / `{"success":false,"message":"Route not found"}`.
- **Local works** because the file exists in your `uploads/properties/` folder.

**To fix:** (1) Set Cloudinary on Render: env vars `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from [cloudinary.com](https://cloudinary.com), then redeploy. (2) Re-upload property images on the live app so they go to Cloudinary and the API stores full URLs. (3) Frontend: use **`getImageUrl(image)`** from `@/lib/api` (see FRONTEND_PROPERTY_IMAGE_GUIDE.md); after re-upload, images will display on live.

---

## What to do: use cloud storage in production

For production (e.g. Render), **don’t rely on the server disk** for uploads. Use **cloud storage** and store **URLs** in the database.

### Option 1: Cloudinary (implemented for property images)

The backend **keeps using Multer** and adds **optional Cloudinary** for **property images**. When these env vars are set on Render, property uploads go to Cloudinary and the API stores the full image URL in `property.images[]`.

1. Sign up at [cloudinary.com](https://cloudinary.com) and get **Cloud name**, **API Key**, and **API Secret** from the dashboard.
2. On Render, set: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. Frontend: use **`getImageUrl(image)`** from `src/lib/api.js` — it returns the value as-is when it **starts with `http`** (Cloudinary), otherwise builds URL as `{API_BASE_URL}/uploads/{path}`. See **FRONTEND_PROPERTY_IMAGE_GUIDE.md** and FRONTEND_IMAGE_GUIDE.md.

Guest/booking/subscription uploads still use disk; you can add Cloudinary for those later if needed.

**Manual setup (if not using the built-in integration):** In the backend, when uploading a property/guest/booking image:
   - Upload the file to Cloudinary (via their SDK or API).
   - Store the **Cloudinary URL** (e.g. `https://res.cloudinary.com/your-cloud/image/upload/...`) in the property/guest/booking document (e.g. in `images[]` or the relevant field).
3. In the frontend, use **`getImageUrl(path)`** from `src/lib/api.js`: it uses the value as-is when it starts with `http`, and builds `{API_BASE_URL}/uploads/{path}` for paths (see FRONTEND_PROPERTY_IMAGE_GUIDE.md).

Result: images persist, and you don’t depend on Render’s filesystem.

### Option 2: AWS S3 (or compatible)

1. Create an S3 bucket and get credentials.
2. On upload, send the file to S3, get the public URL (or use a CDN in front).
3. Store that **full URL** in the database instead of a path under `uploads/`.
4. Frontend uses the stored URL directly.

### Option 3: Render Disk (paid)

Render offers **persistent disk** on paid plans. You can mount a volume and store uploads there so they survive restarts/deploys. This keeps your current “save to disk + serve from `/uploads`” flow, but you must use a persistent volume and a paid plan.

---

## Summary

| Environment | Upload storage        | Image URL                                      | Result        |
|-------------|------------------------|-----------------------------------------------|---------------|
| Local       | Server disk `uploads/` | `http://localhost:5001/uploads/properties/...` | Works         |
| Render      | Ephemeral disk         | `https://...onrender.com/uploads/properties/...` | File missing → 404 “Route not found” |
| Render + cloud storage | Cloudinary / S3  | `https://res.cloudinary.com/...` or S3 URL   | Works         |

So: **the image path format is correct for tenant website images.** The problem is that on Render the file is not on disk. Fix it by using cloud storage in production and storing full image URLs in the API (and using them on the tenant website and elsewhere).
