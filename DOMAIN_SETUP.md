# Domain Setup Guide - zenzerobiogas.com

## Overview
This guide will help you configure your domain to access the website in the `deploy` folder through https://www.zenzerobiogas.com

## Prerequisites
1. ✅ Docker containers running (`docker-compose up -d`)
2. ✅ Frontend accessible at http://localhost:8888
3. ⬜ Domain registered (zenzerobiogas.com)
4. ⬜ Access to domain registrar DNS settings

---

## Step 1: Check Current Server IP

```bash
curl -4 ifconfig.me
```

Note this IP address - you'll need it for DNS configuration.

---

## Step 2: Configure DNS Records

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add these DNS records:

### A Records

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 3600 |
| A | www | YOUR_SERVER_IP | 3600 |

**Example:**
- If your server IP is `148.135.137.236`
- Add A record: `@` → `148.135.137.236`
- Add A record: `www` → `148.135.137.236`

### DNS Propagation Time
- Minimum: 5-30 minutes
- Maximum: 24-48 hours
- Check status: https://dnschecker.org

---

## Step 3: Verify DNS Configuration

Wait a few minutes, then check if DNS is working:

```bash
# Check domain resolution
dig +short www.zenzerobiogas.com
dig +short zenzerobiogas.com

# Should return your server IP
```

---

## Step 4: Install and Configure Caddy

### Option A: Automated Setup (Recommended)

```bash
cd /home/teddy/deploy
chmod +x setup-domain.sh
./setup-domain.sh
```

The script will:
1. ✅ Install Caddy server
2. ✅ Check your DNS configuration
3. ✅ Configure reverse proxy
4. ✅ Obtain SSL certificate automatically
5. ✅ Start Caddy service

### Option B: Manual Setup

```bash
# Install Caddy (Debian/Ubuntu)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
  sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | \
  sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Copy Caddyfile
sudo cp Caddyfile /etc/caddy/Caddyfile

# Start Caddy
sudo systemctl enable caddy
sudo systemctl start caddy
```

---

## Step 5: Access Your Website

Open browser and navigate to:
- **https://www.zenzerobiogas.com** ✨
- **https://zenzerobiogas.com** (will redirect to www)

### First Access Notes
- ⏳ SSL certificate generation takes 1-2 minutes on first access
- 🔒 Caddy automatically obtains certificate from Let's Encrypt
- 🔄 Certificates auto-renew before expiration

---

## Troubleshooting

### Problem: "This site can't be reached"

**Solution:**
```bash
# Check if DNS is configured correctly
dig +short www.zenzerobiogas.com

# Should return your server IP
# If not, wait more time for DNS propagation
```

### Problem: "Connection refused"

**Solution:**
```bash
# Check if frontend container is running
docker ps | grep deploy-frontend

# Check if port 8888 is accessible
curl http://localhost:8888

# Restart containers if needed
cd /home/teddy/deploy
docker-compose restart
```

### Problem: "502 Bad Gateway"

**Solution:**
```bash
# Check Caddy status
sudo systemctl status caddy

# Check Caddy logs
sudo journalctl -u caddy -n 50

# Restart Caddy
sudo systemctl restart caddy
```

### Problem: SSL certificate error

**Solution:**
```bash
# Check Caddy logs for certificate errors
sudo journalctl -u caddy | grep -i cert

# Ensure ports 80 and 443 are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Restart Caddy to retry certificate
sudo systemctl restart caddy
```

---

## Useful Commands

```bash
# Check Caddy status
sudo systemctl status caddy

# Restart Caddy
sudo systemctl restart caddy

# View Caddy logs (live)
sudo journalctl -u caddy -f

# View Caddy access logs
sudo tail -f /var/log/caddy/zenzerobiogas.log

# Reload Caddyfile without restart
caddy reload --config /etc/caddy/Caddyfile

# Test Caddyfile syntax
caddy validate --config /etc/caddy/Caddyfile

# Check firewall status
sudo ufw status

# Open required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## Architecture

```
Internet
    ↓
[DNS: zenzerobiogas.com] → [YOUR_SERVER_IP]
    ↓
[Caddy Server] :80, :443
    ↓ (reverse proxy)
[nginx in Docker] :8888
    ↓
[Frontend App]
```

---

## Security Features

✅ **Automatic HTTPS**: Caddy automatically obtains and renews SSL certificates
✅ **HTTP → HTTPS redirect**: All HTTP traffic redirected to HTTPS
✅ **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
✅ **Gzip compression**: Reduces bandwidth usage
✅ **Non-www → www redirect**: Consistent URLs

---

## Alternative: Using Cloudflare Tunnel (No DNS/Port Opening Required)

If you cannot configure DNS or open ports 80/443, use Cloudflare Tunnel:

```bash
# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create zenzerobiogas

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
url: http://localhost:8888
tunnel: zenzerobiogas
credentials-file: /home/teddy/.cloudflared/YOUR_TUNNEL_ID.json
EOF

# Create DNS record
cloudflared tunnel route dns zenzerobiogas www.zenzerobiogas.com

# Run tunnel
cloudflared tunnel run zenzerobiogas
```

---

## Maintenance

### Updating Caddyfile

1. Edit Caddyfile:
   ```bash
   sudo nano /etc/caddy/Caddyfile
   ```

2. Test configuration:
   ```bash
   caddy validate --config /etc/caddy/Caddyfile
   ```

3. Reload without downtime:
   ```bash
   caddy reload --config /etc/caddy/Caddyfile
   ```

### Certificate Renewal

Caddy automatically renews certificates 30 days before expiration. No action needed.

Check certificate expiry:
```bash
echo | openssl s_client -servername www.zenzerobiogas.com \
  -connect www.zenzerobiogas.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

---

## Support

For issues or questions:
1. Check Caddy logs: `sudo journalctl -u caddy -f`
2. Check container logs: `docker-compose logs -f`
3. Verify DNS: https://dnschecker.org
4. Test SSL: https://www.ssllabs.com/ssltest/

---

**Last Updated**: December 29, 2025
