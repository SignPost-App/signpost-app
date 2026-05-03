# Deploying to a VPS

This app builds to static files and is served by nginx. No runtime process is needed.

## Prerequisites

- A DigitalOcean Droplet (or equivalent) running Ubuntu 24.04
- A domain you control, with access to its DNS settings
- Minimum server specs: 1 vCPU, 512MB RAM, 10GB disk
  - 512MB RAM is enough to run the app, but the build step requires more memory than is typically available. Add a 1GB swap file before building (see [Deploying](#deploying)).

## Point your subdomain at the server

> **Domain forwarding won't work here.** Forwarding is an HTTP redirect — the browser follows it to the destination and the URL bar ends up showing your server's IP address. You need a real DNS A record so that `app.yourdomain.com` resolves directly to your droplet and stays in the URL bar.

In your domain registrar's DNS panel (or DigitalOcean's **Networking → Domains** if you've delegated DNS there), add an A record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `app` | `<droplet IP>` | 3600 |

This makes `app.yourdomain.com` resolve to your droplet. TTL is in seconds — 3600 (1 hour) is a reasonable default. Propagation typically takes a few minutes but can take up to the TTL duration.

You can verify propagation with:

```bash
dig app.yourdomain.com +short
```

It should return your droplet's IP before you proceed.

> **Note:** Certbot (step 3) verifies domain ownership by making an HTTP request to your domain. It will fail if the DNS record hasn't propagated yet. Complete this step and confirm `dig` returns the correct IP before running certbot.

## First-time server setup

SSH in as your admin user, then run the following steps.

### 1. Install dependencies

```bash
sudo apt update && sudo apt install -y nginx nodejs npm git certbot python3-certbot-nginx
```

### 2. Configure nginx

Create `/etc/nginx/sites-available/signpost`:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    root /var/www/signpost;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

The `try_files` line is required for react-router client-side routing to work correctly (all paths fall back to `index.html`).

```bash
sudo ln -s /etc/nginx/sites-available/signpost /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Enable HTTPS

> **Prerequisite:** The DNS A record must be propagated before running this. Certbot verifies ownership over HTTP — if `app.yourdomain.com` doesn't resolve to this server yet, certbot will fail.

```bash
sudo certbot --nginx -d app.yourdomain.com
```

Certbot edits the nginx config and sets up auto-renewal via a systemd timer.

## Deploying

### Add swap (required on 512MB servers)

The Node.js build process needs more memory than a 512MB server has available. Do this once:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### First deploy

```bash
git clone https://github.com/SignPost-App/signpost-app.git ~/signpost-app
cd ~/signpost-app
npm ci
npm run build
sudo mkdir -p /var/www/signpost
sudo rsync -avz --delete dist/ /var/www/signpost/
```

### Subsequent deploys

```bash
cd ~/signpost-app
git pull
npm ci
npm run build
sudo rsync -avz --delete dist/ /var/www/signpost/
```

The `--delete` flag removes files from the server that are no longer in the build output. No nginx restart is needed — nginx serves static files directly.
