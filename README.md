# 6 Stars — Stay & Shop (static site)

Course project landing pages, team profiles, and resource links.

## Repository layout

| Path | Purpose |
|------|---------|
| **`site/`** | **Document root** for nginx / Docker (everything visitors fetch) |
| `site/assets/css/` | `styles.css` |
| `site/assets/js/` | `script.js` |
| `site/team/` | Member profile HTML |
| `site/Iterations/` | Zip deliverables (e.g. `Iteration1.zip`) |
| **`deploy/`** | `nginx-docker.conf`, sample host config, Docker refresh command |

## Preview locally

```bash
cd site && python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Docker image

Build **from the repository root** (same as before):

```bash
docker build -t sixstars-site:latest .
```

The image copies only `site/` into `/usr/share/nginx/html`. If you use a **bind mount** instead of baking files in, mount **`site/`** to `/usr/share/nginx/html` (not the repo root).

One-liner rebuild/run: see [`deploy/update.md`](deploy/update.md).

## System nginx

Use `deploy/sixstars-site.example.conf` as a template. Set `root` to the full path of your `site/` directory.

Theming: edit CSS variables in `site/assets/css/styles.css` (`:root`).
