Rebuild and run the container from the **repository root** (`SixStars/`, where the `Dockerfile` lives):

```bash
cd /home/sanamo/SixStars && docker stop sixstars-site 2>/dev/null; docker rm sixstars-site 2>/dev/null; docker build -t sixstars-site:latest . && docker run -d --name sixstars-site --restart unless-stopped -p 8002:80 sixstars-site:latest
```

**Bind mount (live files):** mount `site/` → `/usr/share/nginx/html`, for example:

`-v /home/sanamo/SixStars/site:/usr/share/nginx/html:ro`
