Rebuild and run the container from the **repository root** (`SixStars/`, where the `Dockerfile` lives):

```bash
cd /home/sanamo/SixStars && docker stop sixstars-site 2>/dev/null; docker rm sixstars-site 2>/dev/null; docker build --no-cache -t sixstars-site:latest . && docker run -d --name sixstars-site --restart unless-stopped -p 8002:80 sixstars-site:latest
```

If the image looks wrong, use **`docker build --no-cache`** (flag goes on **build**, never on **run**). Anything after the image name in `docker run … sixstars-site:latest` is the **container command** — e.g. `… sixstars-site:latest --no-cache` replaces nginx and the container crash-loops (**502**).

After CSS changes, **hard refresh** (`Ctrl+Shift+R`) once.

**Cloudflare:** if the site is orange-cloud proxied, purge cache for `/assets/css/styles.css` (or “Purge everything”) after big style changes — old nginx used `immutable` for 1y and browsers/CDNs kept the old file.

**Cache-bust:** bump `?v=` on **both** `styles.css` and `script.js` in HTML when you change those files. CSS/JS are served with long `immutable` cache (safe because the URL changes when you bump `v`).

**Bind mount (live files):** mount `site/` → `/usr/share/nginx/html`, for example:

`-v /home/sanamo/SixStars/site:/usr/share/nginx/html:ro`

---

## First load still slow (~10s)? Get under ~1s

A **fast static site** can still feel **very slow** if **DNS lookup** drags (often **10s+** with a bad resolver) or if **time to first byte (TTFB)** is high on the document request. Use the **Timing** tab to see which bar is long—not just the total **Time** column.

### 1. Read **Timing** first: DNS vs TTFB

On the document request, open the **Timing** tab (not only the summary **Time** column).

- **DNS lookup ~10s+** and **Waiting for server response (TTFB) ~200ms** → your **resolver or network path to DNS** is slow (ISP DNS, VPN DNS, Pi-hole, broken IPv6, etc.). **Fixing the website or Docker does not fix this.** Change DNS on the device/router to **1.1.1.1** / **1.0.0.1** (Cloudflare) or **8.8.8.8** / **8.8.4.4** (Google), disable VPN to test, or fix the ad-blocker’s upstream. If **IPv6** is broken on your network, try turning it off briefly or fix the AAAA path—some systems wait a long time before falling back to IPv4.
- **DNS fast** but **TTFB several seconds** → bottleneck is **origin / tunnel / edge path**; then use the Pages vs tunnel notes below.

Quick check from a terminal: `dig +stats www.6stars.xyz @1.1.1.1` — if that returns in milliseconds but the browser is slow, the machine’s configured DNS is the problem.

### 2. Best fix: serve the site from **Cloudflare Pages** (recommended for &lt;1s)

Pages stores files on Cloudflare’s network, so the **first** request is usually answered **from a nearby POP** instead of your home uplink.

**One-time setup**

1. In [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → connect this repo **or** use **Direct Upload**.
2. Set **build command** to empty and **build output directory** to **`site`** (this repo’s static root already includes `_headers` for edge caching).
3. Add a **Custom domain** (e.g. `6stars.xyz`) on the Pages project, or create a **CNAME** from `6stars.xyz` → `your-project.pages.dev` as Cloudflare instructs.
4. **Turn off** the old path that sent `6stars.xyz` through the tunnel to Docker for **production** (only one should answer for the hostname—either Pages **or** tunnel, not both fighting).

**Manual deploy (no GitHub)**

```bash
cd /home/sanamo/SixStars
npx wrangler pages deploy site --project-name=sixstars-site
```

(Create the project in the dashboard first if the command asks, or adjust `--project-name`.)

**GitHub Actions**

If the repo is on GitHub, enable workflow **`.github/workflows/cloudflare-pages.yml`**, add secrets **`CLOUDFLARE_API_TOKEN`** and **`CLOUDFLARE_ACCOUNT_ID`**, and set **`--project-name`** in that file to your Pages project name.

### 3. If you must keep Docker + tunnel

These help **a bit** but usually **won’t** reach **&lt;1s** on a cold first hit:

- Run **`cloudflared` on the same machine** as Docker (no extra hop).
- Use a **wired** connection; avoid Wi‑Fi for the origin.
- Upgrade **home upload** speed; tunnels are sensitive to uplink latency and loss.
- In Cloudflare **Cache Rules**, cache **static extensions** (`css`, `js`, `svg`, `png`, `woff2`, …) at the edge. **HTML** is harder: first visitor still pulls from origin unless you use **Pages** or a similar edge cache.

### 4. Large artifact note

`site/iterations/Iteration1.zip` is multi‑MB. It is **not** loaded on the homepage unless someone clicks **Download**; it does **not** explain a slow **first navigation** to `/`.
