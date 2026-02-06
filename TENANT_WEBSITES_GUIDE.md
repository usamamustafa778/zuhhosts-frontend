# How Tenant / Host Public Websites Work

This guide explains how you **provide public booking websites to hosts (tenants)** in Zuha Host — and whether that happens in **this repo** or a **separate one**.

---

## Product model (Shopify-style)

**Every user gets a website; the dashboard is how they manage it.**

- **Website first** — Each host/tenant has their own **public booking site** (e.g. `zuha-stays.zuhahost.com`). That’s their “storefront”: guests discover properties, check availability, and book. It’s the main thing they get.
- **Dashboard as a plus** — The **management dashboard** (login, properties, bookings, website settings, etc.) is the back office to run that website. Like Shopify: your store is the site; the admin is where you manage it.

So: **one website per user + one dashboard to manage it**, all in this system.

---

## Short answer

**Same system, same repo.** The public booking sites (what guests see) are **already in this frontend**. You do **not** need a separate repo. One Next.js app serves:

1. **Public websites** — each tenant’s branded booking site (e.g. `zuha-stays.zuhahost.com`). **This is their “store.”**
2. **Dashboard** — where they log in to manage that site (properties, bookings, website config, etc.). **This is their “admin.”**

---

## Where things live in this repo

| Purpose | Route / URL | Code |
|--------|-------------|------|
| **Tenant website (storefront)** – home | `/public/[slug]` or `[slug].zuhahost.com` | `src/app/public/[slug]/page.js` |
| **Tenant website** – property | `/public/[slug]/property/[id]` | `src/app/public/[slug]/property/[id]/page.js` |
| **Tenant website** – booking | `/public/[slug]/booking/[id]` | `src/app/public/[slug]/booking/[id]/page.js` |
| **Dashboard (admin)** – login, properties, website config, etc. | `/dashboard`, `/website`, `/properties`, … | `src/app/dashboard/`, `src/app/website/`, etc. |

So: **one website per tenant + one dashboard to manage it.** Same deployed app; no second frontend repo.

---

## How tenants get their URL

Each tenant has a **slug** (e.g. `zuha-stays`). Their public site can be reached in two ways:

### 1. Subdomain (production)

- **URL:** `https://zuha-stays.zuhahost.com`
- **How:** User opens that URL → your app is served → `tenantUtils` reads the subdomain → slug = `zuha-stays` → app loads `/public/[slug]` data and renders the tenant’s branding and properties.
- **Requires:** Wildcard DNS and (if you want pretty subdomains) optional middleware so `*.zuhahost.com` is handled by this app.

### 2. Path (works everywhere, incl. dev)

- **URL:** `https://yoursite.com/public/zuha-stays`
- **How:** Next.js route `/public/[slug]` handles it; slug comes from the path. No subdomain setup needed.
- **Use case:** Development, or production without subdomains.

So “providing the website” to a host means: **they (or you) use either**  
`https://<slug>.zuhahost.com` **or** `https://<your-domain>/public/<slug>` — both are served by **this** app.

---

## What you need to do to “provide” the websites

### 1. Deploy this single Next.js app

- Deploy **this repo** once (Vercel, Netlify, your own Node server, etc.).
- Dashboard and all tenant public sites are served by this deployment.

### 2. Point your domain at the app

- **Main domain** (e.g. `app.zuhahost.com` or `zuhahost.com`) → that deployment (for dashboard and path-based public URLs).
- **Subdomains (optional):**  
  - Add a **wildcard** DNS record: `*.zuhahost.com` → same deployment.  
  - Then `zuha-stays.zuhahost.com`, `another-tenant.zuhahost.com`, etc. all hit the same app; `tenantUtils` and `/public/[slug]` use the subdomain as the slug.

### 3. Optional: middleware for subdomain → public page

Right now the app uses **client-side** logic (`getTenantSlugFromSubdomain()` in `src/utils/tenantUtils.js`) to get the slug from the hostname. So:

- If the user goes to `zuha-stays.zuhahost.com`, the **first** request might still load the default Next.js entry (e.g. home or dashboard). Then client-side code can redirect or render the public site based on subdomain.
- If you want **all** requests to `*.zuhahost.com` (except e.g. `app.zuhahost.com`) to go straight to the tenant public site, add **Next.js middleware** that:
  - Reads the host (e.g. `zuha-stays.zuhahost.com`).
  - If it’s a tenant subdomain, rewrite the request to `/public/zuha-stays` (or the current path under that slug).
  - Then the existing `/public/[slug]/` pages render with the correct slug.

Either way, **no second repo** — just this app + optional middleware.

### 4. Backend

- Your backend must expose the **public** APIs described in `WEBSITE_API.md` (e.g. `GET /public/:tenantSlug/info`, `GET /public/:tenantSlug/properties`, etc.).
- This app already calls those from `src/app/public/[slug]/` and `src/lib/api.js`. So “providing the websites” also means: **backend is deployed and these routes are live**.

### 5. What hosts see

- In the **dashboard** → **Website** page, hosts see their **public URL** (e.g. `zuha-stays.zuhahost.com` or `/public/zuha-stays`). They can share that with guests.
- Enabling “public website” in dashboard just toggles the backend flag; the **same** frontend (this repo) serves their site when that URL is opened.

---

## Summary

| Question | Answer |
|----------|--------|
| **Product model** | **Shopify-style:** Every user gets a **website** (their booking site); the **dashboard** is where they manage it. |
| Same system or separate repo? | **Same system, same repo.** |
| Where is the public site code? | **This repo:** `src/app/public/[slug]/` and `src/utils/tenantUtils.js`. |
| How do hosts get a website? | You deploy this app once; each host’s site is reached by **subdomain** (`slug.zuhahost.com`) or **path** (`/public/slug`). |
| Do I need a separate “public website” repo? | **No.** One Next.js app serves both every tenant’s website and their management dashboard. |
| What do I need to do? | Deploy this app, point your domain (and optionally `*.zuhahost.com`) at it, ensure backend public APIs are live. Optionally add middleware so subdomain requests rewrite to `/public/[slug]`. |

If you want, the next step can be a short **middleware example** that rewrites `https://<slug>.zuhahost.com` → `/public/<slug>` so every tenant subdomain goes straight to their public site.
