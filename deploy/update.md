```bash
cd /home/sanamo/SixStars && docker stop sixstars-site 2>/dev/null; docker rm sixstars-site 2>/dev/null; docker build --no-cache -t sixstars-site:latest . && docker run -d --name sixstars-site --restart unless-stopped -p 8002:80 sixstars-site:latest
```