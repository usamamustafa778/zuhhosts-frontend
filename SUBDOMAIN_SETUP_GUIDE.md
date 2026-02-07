# Zuha Host V2 — Subdomain Setup Guide

## Overview

Each tenant gets a public booking website at:

**`{tenantSlug}.zuhahost.com`**

Example: Tenant with slug `sunrise-hotel` → **sunrise-hotel.zuhahost.com**

This guide covers how the subdomain is **created automatically from the slug**, plus DNS, SSL, hosting, and how the frontend uses it.

---

## Automatic subdomain from slug (no per-tenant setup)

Subdomains are **not** created one-by-one. They work automatically using the tenant **slug**:

1. **Slug is created when the tenant is created**
   - **Register:** New user → backend creates a Tenant with a unique `slug` (from business/name, e.g. "Zuha Stays" → `zuha-stays`).
   - **Tenant setup:** Existing user without tenant → `POST /api/tenants/setup` creates a Tenant with a unique `slug` (from `name` in body or user’s name).
   - Slug rules: lowercase, letters, numbers, hyphens only; **unique** in the DB (backend adds `-1`, `-2`, etc. if needed).

2. **Subdomain = slug**
   - Public URL is **always** `{slug}.zuhahost.com`.
   - Example: slug `zuha-stays` → **zuha-stays.zuhahost.com**. No extra “create subdomain” step.

3. **One wildcard for all tenants**
   - You add **one** DNS record: `*.zuhahost.com` → your app (wildcard).
   - **Every** `{anything}.zuhahost.com` goes to the same app. The app uses the subdomain part as `tenantSlug` and calls `/public/{tenantSlug}/...`.
   - So when a new tenant gets slug `beach-villa`, their site is **beach-villa.zuhahost.com** immediately—no new DNS or server config.

4. **What the backend stores and returns**
   - **Tenant** model: `slug` (unique), `name`, `publicWebsite`, etc.
   - **GET /api/tenants/website/config** and **GET /api/tenants/me** return `publicUrl: "{slug}.zuhahost.com"` so the dashboard can show “Your public site: zuha-stays.zuhahost.com”.

**Summary:** Create tenant (register or setup) → backend generates unique `slug` → subdomain is `{slug}.zuhahost.com` by convention → you only need wildcard DNS + SSL once. No per-tenant subdomain creation.

---

### No manual subdomains — one wildcard = all tenants (1 or 10,000)

You do **not** add subdomains one by one. You add **one** wildcard:

- **DNS:** One record: `*` (or `*.zuhahost.com`) → your app. That covers **every** subdomain: zuha-stays, sunrise-hotel, tenant-1, tenant-1000, anything.
- **Vercel / Netlify / hosting:** Add **one** domain: `*.zuhahost.com`. Do **not** add zuha-stays.zuhahost.com, tenant2.zuhahost.com, etc. The wildcard `*` means “any subdomain,” so all current and future tenants work automatically.
- **SSL:** One wildcard certificate for `*.zuhahost.com` covers all subdomains.

So: 1 tenant or 1,000 tenants — you still only add the wildcard once. New tenants get their subdomain (e.g. new-tenant.zuhahost.com) automatically because the slug is the subdomain and the wildcard already points everything to your app.

**Where the slug is set (backend):**
- **Register:** `controllers/registerController.js` — creates Tenant with slug from `generateUniqueSlug(tenantName)` (from business name or user name).
- **Tenant setup:** `controllers/tenantSetupController.js` — creates Tenant with slug from `Tenant.generateSlug(tenantName)` + uniqueness loop.
- **Tenant model:** `models/Tenant.js` — `slug` is required, unique, lowercase; `generateSlug(name)` static for “name → slug” format.

---

## 1. How It Works (End-to-End)

```
Guest visits:  sunrise-hotel.zuhahost.com
       ↓
DNS resolves:  sunrise-hotel.zuhahost.com → Your server / hosting IP
       ↓
App receives request with Host: sunrise-hotel.zuhahost.com
       ↓
Frontend reads subdomain: "sunrise-hotel" (tenant slug)
       ↓
Frontend calls API: GET /public/sunrise-hotel/info
                   GET /public/sunrise-hotel/properties
       ↓
Backend returns tenant's data (no auth required)
       ↓
Frontend renders tenant's branded booking site
```

**Backend:** Already supports this. All public APIs use `tenantSlug` in the path (e.g. `/public/:tenantSlug/properties`). No backend change needed for subdomains.

**Frontend:** Must read the subdomain from the URL and use it as `tenantSlug` in every public API call.

---

## 1.1 Base domain and reserved subdomains

You use one domain (e.g. `zuhahost.com`) for both the **dashboard** and **tenant sites**. Reserve specific subdomains so they are not treated as tenant slugs:

| Subdomain / URL | Purpose |
|-----------------|--------|
| **zuhahost.com** (root) | Marketing or redirect to dashboard |
| **app.zuhahost.com** (or **dashboard.zuhahost.com**) | Dashboard app (login, properties, website config, etc.) |
| **www.zuhahost.com** | Usually same as root or redirect |
| **api.zuhahost.com** | Optional: API host (if you serve API from same domain) |
| **Anything else** (e.g. zuha-stays, sunrise-hotel) | Tenant public site → slug = subdomain |

**Reserved list (frontend):** In middleware or `getTenantSlug`, skip subdomains like `app`, `www`, `api`, `dashboard` so those hosts do not rewrite to `/public/[slug]`. Only “unknown” subdomains are treated as tenant slugs and rewritten to the public tenant site.

---

## 1.2 Next.js middleware (frontend, optional but recommended)

Without middleware, a request to `zuha-stays.zuhahost.com` might hit the root of the app (e.g. marketing or dashboard). To send **all tenant subdomain** traffic to the public tenant site:

1. Add **middleware.js** at the project root (same level as `package.json`).
2. Read `request.headers.get('host')` (e.g. `zuha-stays.zuhahost.com`).
3. If the host has a subdomain and it’s **not** reserved (`www`, `app`, `api`, `dashboard`), **rewrite** to `/public/[slug]` and preserve the path.  
   Example: `zuha-stays.zuhahost.com/property/123` → `/public/zuha-stays/property/123`.
4. Use `NextResponse.rewrite(url)` for tenant subdomains and `NextResponse.next()` otherwise.

After this, requests to `zuha-stays.zuhahost.com` are rewritten to `/public/zuha-stays` and your `/public/[slug]` pages render the tenant site. The backend does not need middleware; it only serves `/public/:tenantSlug/...` by path.

---

## 1.3 Different domain (optional)

If you use a different base domain (e.g. `myapp.com`):

- **Backend:** Set **PUBLIC_BASE_DOMAIN** in `.env` (e.g. `PUBLIC_BASE_DOMAIN=myapp.com`). All responses that include `publicUrl` (e.g. `/api/tenants/me`, `/api/tenants/website/config`, register/setup) will then return `{slug}.myapp.com` instead of `{slug}.zuhahost.com`. See `config/domain.js`.
- **Frontend:** Set **NEXT_PUBLIC_BASE_DOMAIN** (e.g. `myapp.com`) so subdomain detection uses `*.myapp.com`.
- Add DNS wildcard **\*.myapp.com** → your app and SSL for `*.myapp.com`.
- In middleware and `getTenantSlug`, use this base domain. Backend uses `tenantSlug` in the path (`/public/:tenantSlug/...`); only `publicUrl` in responses changes with the env.

---

## 2. DNS Configuration

### 2.1 Wildcard Subdomain (Recommended)

One DNS record serves **all** tenant subdomains.

| Type  | Name   | Value                    | TTL  |
|-------|--------|--------------------------|------|
| A     | `*`    | `YOUR_SERVER_IP`         | 3600 |
| or    |        |                          |      |
| CNAME | `*`    | `your-app.vercel.app`    | 3600 |

- **A record:** Point `*.zuhahost.com` to the IP of the server hosting your app.
- **CNAME:** Point `*.zuhahost.com` to the hostname provided by your hosting (e.g. Vercel, Netlify, Load Balancer).

**Examples by provider:**

- **Cloudflare:** DNS → Add record → Type `A` or `CNAME`, Name `*`, Value = IP or hostname.
- **GoDaddy / Namecheap:** Add record: Host `*`, Type A or CNAME, Value = IP or hostname.
- **AWS Route 53:** Create record: `*.zuhahost.com` → A or CNAME to your target.

Result: Any subdomain (e.g. `sunrise-hotel.zuhahost.com`, `beach-villa.zuhahost.com`) resolves to the same application. The app then decides what to show based on the subdomain (tenant slug).

### 2.2 Root Domain (Optional)

If you also want `zuhahost.com` (no subdomain):

| Type | Name | Value           |
|------|------|-----------------|
| A    | `@`  | YOUR_SERVER_IP  |
| CNAME| `@`  | app hostname    |

Use this for your main marketing site or app entry point.

---

## 3. SSL (HTTPS) for Subdomains

### 3.1 Wildcard Certificate

To support `https://*.zuhahost.com` you need a **wildcard** certificate.

**Option A: Let's Encrypt (Free)**

- Works well on your own server (e.g. Nginx, Node).
- Wildcard certs require **DNS challenge** (you add a TXT record they give you).

```bash
# Example with certbot (DNS plugin depends on your DNS provider)
certbot certonly --manual --preferred-challenges dns -d "*.zuhahost.com" -d "zuhahost.com"
# Follow prompts to add TXT record, then verify
```

**Option B: Hosting Provider (Easiest)**

- **Vercel / Netlify / Cloudflare Pages:** Add `*.zuhahost.com` (and optionally `zuhahost.com`) in the dashboard; they issue and renew SSL for you.
- **Cloudflare (Proxy):** Turn on “Proxy” (orange cloud) and use Cloudflare’s SSL; they handle HTTPS for all subdomains.

### 3.2 Summary

| Where you host        | SSL approach                          |
|-----------------------|----------------------------------------|
| Vercel / Netlify      | Add wildcard domain → auto SSL        |
| Cloudflare Pages      | Add custom domain + wildcard → auto   |
| Your own server       | Let's Encrypt wildcard (DNS challenge)|
| Cloudflare Proxy      | SSL/TLS set to “Full” or “Full (strict)” |

---

## 4. Hosting Options for the Public Website

The **public booking site** (tenant subdomains) can be:

- A separate frontend app (e.g. Next.js/React) that only serves `*.zuhahost.com`,  
  **or**
- The same app as your main dashboard, with routing that shows “dashboard” vs “public site” based on hostname.

Below: one app that serves both by subdomain.

### 4.1 Option A: Vercel (Recommended for Next.js)

**Important:** You add **one** wildcard domain in Vercel. You do **not** add each tenant’s subdomain manually (no zuha-stays.zuhahost.com, tenant2.zuhahost.com, etc.). The wildcard covers all tenants now and in the future.

1. **Add domain in Vercel (one time only)**
   - Project → Settings → Domains
   - Add: **`*.zuhahost.com`** (wildcard — this one entry covers every tenant subdomain)
   - Optionally add: `zuhahost.com` (root) and `app.zuhahost.com` (dashboard) if you use them

2. **DNS (one record)**
   - At your DNS provider, add **one** CNAME: `*` → `cname.vercel-dns.com` (Vercel shows the exact target).
   - That single record makes **all** subdomains (zuha-stays, sunrise-hotel, tenant-1000, …) point to the same Vercel project.

3. **Detect tenant in the app**
   - In Next.js: read `req.headers.host` or `request.nextUrl.hostname` (e.g. `sunrise-hotel.zuhahost.com`), take the first part as `tenantSlug`, call `/public/sunrise-hotel/info`, etc.

4. **Result**
   - Every `{slug}.zuhahost.com` (1 or 10,000 tenants) hits the same Vercel project. No per-tenant domain setup in Vercel.

---

### 4.1a Namecheap + Vercel (step-by-step)

Your domain is on **Namecheap** and your app is on **Vercel**. Do this once; the wildcard covers all tenant subdomains.

**Step 1 — Add domains in Vercel**

1. Open your project on [Vercel](https://vercel.com) → **Settings** → **Domains**.
2. Click **Add** and add:
   - **`*.zuhahost.com`** (wildcard — required for tenant subdomains; one entry for all tenants)
   - **`zuhahost.com`** (optional; for root, e.g. marketing or redirect)
   - **`app.zuhahost.com`** (optional; for dashboard if you use it)
3. For each domain, Vercel will show a status like “Invalid configuration” and tell you which DNS records to add. Note the **target** they give (e.g. `cname.vercel-dns.com` for CNAME).

**Step 2 — Configure DNS in Namecheap**

1. Log in to [Namecheap](https://www.namecheap.com) → **Domain List** → click **Manage** next to your domain.
2. Open the **Advanced DNS** tab.
3. Add the records Vercel asks for (use the exact Type, Host, and Value Vercel shows):

   **For the wildcard (tenant subdomains):**

   | Type  | Host | Value                    | TTL  |
   |-------|------|--------------------------|------|
   | CNAME | `*`  | `cname.vercel-dns.com`   | Auto |

   - **Host:** enter **`*`** (asterisk only). That means “any subdomain” (zuha-stays, sunrise-hotel, etc.).
   - **Value:** use the target Vercel shows (often `cname.vercel-dns.com`; Vercel may show a different hostname — use theirs).
   - Save.

   **For the root domain `zuhahost.com` (if you added it in Vercel):**

   - Vercel may ask for an **A record** with Host `@` and Value `76.76.21.21`, or a **CNAME** with Host `@` and Value `cname.vercel-dns.com`. Namecheap supports both; add what Vercel specifies.
   - If they ask for CNAME at root and Namecheap doesn’t allow CNAME on `@`, use their **URL Redirect** or **ALIAS** if available, or follow Namecheap’s current instructions for “pointing root to Vercel.”

   **For `app.zuhahost.com` (if you use it):**

   | Type  | Host | Value                    | TTL  |
   |-------|------|--------------------------|------|
   | CNAME | `app`| `cname.vercel-dns.com`   | Auto |

   - **Host:** `app`. **Value:** same as Vercel shows.

4. Remove or don’t add conflicting records (e.g. duplicate CNAME for `*`).
5. Wait a few minutes up to 48 hours for DNS to propagate. Vercel will show “Valid” when it’s correct.

**Step 3 — SSL**

- Vercel issues and renews SSL for the domains you added. No extra step once DNS is valid.

---

**If Vercel gave you two nameservers (instead of a CNAME target)**

Sometimes Vercel asks you to **change nameservers** and shows two (or more) nameserver hostnames (e.g. `ns1.vercel-dns.com` and `ns2.vercel-dns.com`). That’s the **“use Vercel DNS”** option: Vercel will host DNS for your domain, and they’ll set up the wildcard for you.

**What to do:**

1. **In Namecheap:** Domain List → **Manage** → **Nameservers** (not Advanced DNS).
2. Choose **Custom DNS** and enter the **two nameservers** Vercel gave you (e.g. `ns1.vercel-dns.com`, `ns2.vercel-dns.com`). Save.
3. **Do not** add CNAME records in Namecheap for `*` — once nameservers point to Vercel, Vercel manages all DNS.
4. **In Vercel:** Your domain (`*.zuhahost.com` and any others you added) will show “Valid” after nameserver propagation (from a few minutes up to 48 hours). Vercel will create the right records (including the wildcard) on their side.

**Summary:** You’re not adding a CNAME for `*` in Namecheap. You’re pointing the **whole domain** to Vercel by changing nameservers to the two Vercel gave you. After that, Vercel handles DNS and the wildcard; every `{slug}.zuhahost.com` will work.

---

**Summary (CNAME approach)**

- **Namecheap:** One CNAME: Host **`*`** → Value **Vercel’s target** (e.g. `cname.vercel-dns.com`). Optionally root and `app` as Vercel instructs.
- **Vercel:** One domain entry **`*.zuhahost.com`** (and optionally root / `app`). No per-tenant domains.
- After DNS propagates, every `{slug}.zuhahost.com` works for your tenants without any more DNS or Vercel changes.

### 4.2 Option B: Netlify

**One wildcard only.** Add `*.zuhahost.com` once; do not add each tenant subdomain.

1. **Domain (one time)**
   - Site → Domain management → Add custom domain: **`*.zuhahost.com`**. This one wildcard covers all tenant subdomains.

2. **DNS (one record)**
   - Add one CNAME: `*` → the hostname Netlify gives you (e.g. `apex-loadbalancer.netlify.com`).

3. **App**
   - Read subdomain from hostname, extract slug, call `/public/{tenantSlug}/...`. All tenants use the same deployment.

### 4.3 Option C: Your Own Server (Nginx + Node/Next)

1. **Nginx** — catch all subdomains and forward to your app:

```nginx
server {
    listen 443 ssl http2;
    server_name *.zuhahost.com zuhahost.com;

    ssl_certificate     /etc/letsencrypt/live/zuhahost.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zuhahost.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;  # Next.js or React app
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. **App**
   - Use `Host` header (e.g. `sunrise-hotel.zuhahost.com`) to get tenant slug and call backend.

### 4.4 Option D: Cloudflare (Proxy + optional Workers)

- **DNS:** A or CNAME for `*` to your server or to Vercel/Netlify.
- **Proxy:** Turn on Cloudflare proxy (orange cloud) so they handle SSL and DDoS.
- **Optional:** Cloudflare Worker to rewrite or route by subdomain before hitting your app (usually not needed if your app already reads the Host header).

---

## 5. Frontend: Using the Subdomain as Tenant Slug

The backend expects **tenant slug** in the path. The frontend must get that slug from the subdomain.

### 5.1 Get Tenant Slug in the Browser

```javascript
// Get tenant slug from subdomain
// Examples: sunrise-hotel.zuhahost.com → "sunrise-hotel"
//           localhost:3000 (dev) → use ?tenant=sunrise-hotel or default

const getTenantSlug = () => {
  if (typeof window === 'undefined') return null; // SSR

  const hostname = window.location.hostname;

  // Production: subdomain.zuhahost.com
  if (hostname.endsWith('.zuhahost.com')) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[0]; // "sunrise-hotel"
    }
  }

  // Local dev: localhost or 127.0.0.1 — use query param
  const params = new URLSearchParams(window.location.search);
  return params.get('tenant') || 'demo'; // e.g. ?tenant=sunrise-hotel
};

export { getTenantSlug };
```

### 5.2 Use Slug in API Calls

```javascript
const tenantSlug = getTenantSlug();

// Fetch tenant's public info
const info = await fetch(`${API_URL}/public/${tenantSlug}/info`).then(r => r.json());

// Fetch properties
const properties = await fetch(`${API_URL}/public/${tenantSlug}/properties`).then(r => r.json());

// Create booking
await fetch(`${API_URL}/public/${tenantSlug}/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ propertyId, roomId, startDate, endDate, guestInfo, ... }),
});
```

### 5.3 Next.js (SSR) — Get Slug on Server

```javascript
// getServerSideProps or in API route / middleware
export const getServerSideProps = async (context) => {
  const host = context.req.headers.host || '';  // e.g. sunrise-hotel.zuhahost.com
  const tenantSlug = host.startsWith('localhost')
    ? (context.query.tenant || 'demo')
    : host.split('.')[0];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [infoRes, propertiesRes] = await Promise.all([
    fetch(`${apiUrl}/public/${tenantSlug}/info`),
    fetch(`${apiUrl}/public/${tenantSlug}/properties`),
  ]);

  const info = await infoRes.json();
  const properties = await propertiesRes.json();

  return {
    props: {
      tenantSlug,
      tenantInfo: info.data,
      properties: properties.data,
    },
  };
};
```

So: **subdomain connection = DNS + SSL + same app that reads subdomain and calls existing `/public/:tenantSlug/...` APIs.** No backend change required for subdomains.

---

## 6. Tenant Slug Rules (Backend Already Enforces)

- Stored in **Tenant** model as `slug`.
- Used in URLs and subdomains: **lowercase, letters, numbers, hyphens only** (e.g. `sunrise-hotel`, `beach-villa-2`).
- When a tenant is created, generate slug from name (e.g. "Sunrise Hotel" → `sunrise-hotel`) and ensure **uniqueness** in the DB.

Your backend already has:

- `Tenant.generateSlug(name)` (or similar) and unique index on `slug`.
- Public routes: `/public/:tenantSlug/...`.

So **each tenant automatically gets a subdomain** in the sense that:

1. They get a unique `slug` when created.
2. That slug is used in the subdomain: `{slug}.zuhahost.com`.
3. DNS wildcard sends all `*.zuhahost.com` to your app.
4. Frontend reads subdomain → uses it as `tenantSlug` in every public API call.

No per-tenant DNS or server config needed.

---

## 7. Local Development

Subdomains don’t work on plain localhost. Use one of these:

**Path-based (recommended):**

- Open: **`http://localhost:3000/public/zuha-stays`** (or `/public/sunrise-hotel`).
- The frontend route `/public/[slug]` gets the slug from the path. No subdomain needed.

**Query param:**

- Open: `http://localhost:3000?tenant=zuha-stays` so that pages using `getTenantSlugFromSubdomain()` (or similar) can read `?tenant=zuha-stays` when host is `localhost`.

**Optional — local subdomains:**

- Add to **/etc/hosts:**  
  `127.0.0.1 zuha-stays.zuhahost.local`
- Use **\*.zuhahost.local** in dev and **\*.zuhahost.com** in production. Update frontend tenant utils and middleware to treat `.zuhahost.local` like the base domain (split by `.`, first part = slug).

---

## 8. Checklist

| Step | Task | Done |
|------|------|------|
| 1 | Add DNS: `*` (A or CNAME) → your app host / IP | ☐ |
| 2 | Add SSL: wildcard cert (provider or Let's Encrypt) | ☐ |
| 3 | Reserve subdomains (app, www, api) in frontend so they’re not tenant slugs | ☐ |
| 4 | In app: read subdomain → `tenantSlug` (or path `/public/[slug]` in dev) | ☐ |
| 5 | Optional: Next.js middleware to rewrite subdomain → `/public/[slug]` | ☐ |
| 6 | All public API calls use `tenantSlug` in path | ☐ |
| 7 | Local dev: use `/public/zuha-stays` or `?tenant=zuha-stays` | ☐ |
| 8 | Ensure every new tenant has a unique `slug` (backend does this) | ☐ |

---

## 9. Summary

- **Backend:** No change. It already exposes `/public/:tenantSlug/...`.
- **Subdomain = tenant slug:** e.g. `sunrise-hotel.zuhahost.com` → slug `sunrise-hotel`.
- **DNS:** One wildcard record `*.zuhahost.com` → your app.
- **SSL:** Wildcard certificate for `*.zuhahost.com`.
- **Frontend:** Read subdomain (or path/query in dev), pass as `tenantSlug` to every public API call. Reserve `app`, `www`, `api` so they don’t act as tenant slugs.
- **Optional:** Next.js middleware rewrites `{slug}.zuhahost.com` → `/public/[slug]`. Local dev: path `/public/zuha-stays` or `?tenant=zuha-stays`.

With this, **each tenant automatically gets a subdomain** as soon as they have a unique `slug` in the database; no manual DNS or server config per tenant.

---

## 10. Quick reference (FAQ)

| Question | Answer |
|----------|--------|
| Do I create a DNS record per tenant? | **No.** One wildcard `*.zuhahost.com` is enough for 1 or 10,000 tenants. |
| Do I add each subdomain in Vercel/Netlify? | **No.** Add **one** domain: `*.zuhahost.com`. The wildcard covers every tenant subdomain automatically. |
| How is the subdomain “created”? | **Automatic.** The tenant’s slug (from backend) is the subdomain. No manual subdomain creation anywhere. |
| What do I set up? | DNS: **one** wildcard `*.zuhahost.com` → your app. Hosting: add **one** wildcard domain + SSL. Optional: Next.js middleware. |
| Where does the slug come from? | **Backend** (tenant create/setup). Frontend shows `{slug}.zuhahost.com` as the tenant’s public URL. |
| What about app vs tenant URLs? | Use a reserved subdomain for dashboard (e.g. `app.zuhahost.com`). Any other subdomain = tenant slug. |
| What if I use a different domain? | Set `NEXT_PUBLIC_BASE_DOMAIN` (e.g. `myapp.com`) and use `*.myapp.com` in DNS; update frontend. Backend stays the same. |
| Local development? | Use path `http://localhost:3000/public/zuha-stays` or query `?tenant=zuha-stays`. Optional: `*.zuhahost.local` with `/etc/hosts`. |
