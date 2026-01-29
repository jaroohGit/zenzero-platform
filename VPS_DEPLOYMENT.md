# VPS Deployment Guide - Zenzero Biogas Platform

This guide provides step-by-step instructions for deploying the Zenzero Biogas Platform to a VPS (Virtual Private Server) and running shell scripts.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [VPS Setup](#vps-setup)
3. [Upload Code to VPS](#upload-code-to-vps)
4. [Install Dependencies](#install-dependencies)
5. [Deploy with Docker](#deploy-with-docker)
6. [Run Shell Scripts](#run-shell-scripts)
7. [Domain Configuration](#domain-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Machine
- Git installed
- SSH client (comes with macOS/Linux, use PuTTY on Windows)
- (Optional) rsync for file transfer

### VPS Requirements
- Ubuntu 20.04/22.04 LTS or Debian 10/11
- Minimum 2GB RAM (4GB recommended)
- 20GB+ disk space
- Root or sudo access
- Public IP address

---

## VPS Setup

### 1. Connect to Your VPS

```bash
# Replace YOUR_VPS_IP with your actual VPS IP address
ssh root@YOUR_VPS_IP

# Or if using a non-root user
ssh username@YOUR_VPS_IP
```

### 2. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Required Software

#### Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
```

#### Install Docker Compose
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

#### Install Git
```bash
sudo apt install git -y
git --version
```

#### Install Node.js (Optional - for local development)
```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Upload Code to VPS

You have several options to upload your code to the VPS:

### Option 1: Clone from GitHub (Recommended)

```bash
# Create deployment directory
mkdir -p /home/$USER/deploy
cd /home/$USER/deploy

# Clone the repository
git clone https://github.com/jaroohGit/zenzero-platform.git .

# Or if you have a specific branch
git clone -b your-branch-name https://github.com/jaroohGit/zenzero-platform.git .
```

### Option 2: Upload via SCP (from local machine)

```bash
# On your local machine, navigate to project directory
cd /path/to/zenzero-platform

# Upload entire project to VPS
scp -r . username@YOUR_VPS_IP:/home/username/deploy/

# Or use rsync for faster, resumable uploads
rsync -avz --progress . username@YOUR_VPS_IP:/home/username/deploy/
```

### Option 3: Upload via SFTP

```bash
# Connect with SFTP
sftp username@YOUR_VPS_IP

# Create directory
mkdir /home/username/deploy

# Upload files
put -r /local/path/to/zenzero-platform/* /home/username/deploy/

# Exit SFTP
exit
```

### Option 4: Use Git with SSH Key (Most Secure)

```bash
# On VPS, generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Add this key to your GitHub account (Settings > SSH and GPG keys)
# Then clone the repository
cd /home/$USER/deploy
git clone git@github.com:jaroohGit/zenzero-platform.git .
```

---

## Install Dependencies

After uploading the code, install the necessary dependencies:

```bash
cd /home/$USER/deploy

# Make shell scripts executable
chmod +x *.sh
chmod +x backend/*.sh

# If using local development (without Docker)
# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## Deploy with Docker

### 1. Build and Start Services

```bash
cd /home/$USER/deploy

# Start all services using docker-compose
docker-compose up -d

# Check if services are running
docker-compose ps
```

Expected output:
```
Name                        State   Ports
---------------------------------------------------------
deploy-frontend             Up      0.0.0.0:8888->80/tcp
deploy-mqtt-broker          Up      0.0.0.0:1883->1883/tcp, ...
deploy-timescaledb          Up      0.0.0.0:5436->5432/tcp
```

### 2. View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f mqtt-broker
docker-compose logs -f timescaledb
```

### 3. Test the Deployment

```bash
# Test frontend (should return HTML)
curl http://localhost:8888

# Test backend API (should return JSON)
curl http://localhost:3001/status

# Test MQTT broker
docker exec -it deploy-mqtt-broker npm run publisher
```

---

## Run Shell Scripts

The repository includes several useful shell scripts:

### 1. Docker Management Script

```bash
cd /home/$USER/deploy

# Start services
./docker-manage.sh start

# Stop services
./docker-manage.sh stop

# Restart services
./docker-manage.sh restart

# View logs
./docker-manage.sh logs

# View specific service logs
./docker-manage.sh logs frontend

# Check status
./docker-manage.sh status

# Rebuild images
./docker-manage.sh rebuild all
./docker-manage.sh rebuild frontend
./docker-manage.sh rebuild backend
```

### 2. Domain Setup Script

```bash
cd /home/$USER/deploy

# Run domain setup (requires DNS configuration first)
sudo ./setup-domain.sh
```

This script will:
- Install Caddy web server
- Configure reverse proxy
- Obtain SSL certificate from Let's Encrypt
- Enable HTTPS access

### 3. Test Deployment Script

```bash
cd /home/$USER/deploy

# Run post-deployment tests
./test-after-deploy.sh
```

### 4. Quick Test Script

```bash
cd /home/$USER/deploy

# Run quick functionality test
./quick-test.sh
```

### 5. Detection Testing Scripts

```bash
cd /home/$USER/deploy

# Run detection tests
./tune-detection.sh

# Run Docker-based tests
./run-test-docker.sh
```

---

## Domain Configuration

### 1. Configure DNS Records

Before running the domain setup script, configure your DNS:

1. Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Add these DNS A records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 3600 |
| A | www | YOUR_VPS_IP | 3600 |

3. Wait 5-30 minutes for DNS propagation

### 2. Run Domain Setup

```bash
cd /home/$USER/deploy
sudo ./setup-domain.sh
```

Follow the prompts to complete the setup.

### 3. Open Firewall Ports

```bash
# Install UFW if not installed
sudo apt install ufw -y

# Configure firewall
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8888/tcp    # Frontend (optional, if accessing directly)
sudo ufw allow 1883/tcp    # MQTT (optional, if public access needed)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 4. Access Your Application

After DNS propagation and domain setup:
- **HTTPS**: https://www.zenzerobiogas.com
- **HTTP**: http://www.zenzerobiogas.com (redirects to HTTPS)

---

## Troubleshooting

### Services Not Starting

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check logs for errors
docker-compose logs

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use

```bash
# Find process using a port (e.g., 8888)
sudo lsof -i :8888

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID

# Or stop all containers and restart
docker-compose down
docker-compose up -d
```

### Cannot Connect to VPS

```bash
# Check if SSH service is running
sudo systemctl status ssh

# Check firewall rules
sudo ufw status

# Allow SSH if blocked
sudo ufw allow 22/tcp
```

### Website Not Accessible

```bash
# Check if Caddy is running
sudo systemctl status caddy

# Check Caddy logs
sudo journalctl -u caddy -n 50

# Restart Caddy
sudo systemctl restart caddy

# Check if DNS is resolving correctly
dig +short www.zenzerobiogas.com

# Check if ports are open
sudo netstat -tuln | grep -E '80|443'
```

### Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Verify
docker ps
```

### SSL Certificate Issues

```bash
# Check Caddy logs
sudo journalctl -u caddy | grep -i cert

# Ensure ports 80 and 443 are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Restart Caddy
sudo systemctl restart caddy

# Wait 2-3 minutes for certificate generation
```

### Database Connection Issues

```bash
# Check if TimescaleDB container is running
docker ps | grep timescaledb

# Check database logs
docker logs deploy-timescaledb

# Restart database
docker restart deploy-timescaledb

# Connect to database to verify
docker exec -it deploy-timescaledb psql -U postgres -d wwt_data
```

---

## Updating the Application

### Update Code from Git

```bash
cd /home/$USER/deploy

# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Manual Update

```bash
# Upload new files via SCP or rsync
# Then rebuild and restart
cd /home/$USER/deploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Backup and Maintenance

### Backup Database

```bash
# Create backup directory
mkdir -p /home/$USER/backups

# Backup database
docker exec deploy-timescaledb pg_dump -U postgres wwt_data > /home/$USER/backups/db-backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore Database

```bash
# Restore from backup
docker exec -i deploy-timescaledb psql -U postgres wwt_data < /home/$USER/backups/db-backup-YYYYMMDD-HHMMSS.sql
```

### Monitor System Resources

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker stats
docker stats

# Check running processes
htop
```

---

## Security Best Practices

1. **Use SSH Keys**: Disable password authentication
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart ssh
   ```

2. **Keep System Updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Use Environment Variables**: Store sensitive data in `.env` files
   ```bash
   # Create .env file
   nano /home/$USER/deploy/.env
   # Add your secrets, then:
   chmod 600 /home/$USER/deploy/.env
   ```

4. **Regular Backups**: Automate database backups with cron
   ```bash
   # Edit crontab
   crontab -e
   
   # Add daily backup at 2 AM
   0 2 * * * docker exec deploy-timescaledb pg_dump -U postgres wwt_data > /home/$USER/backups/db-backup-$(date +\%Y\%m\%d).sql
   ```

5. **Monitor Logs**: Regularly check application and system logs

---

## Additional Resources

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Local development guide
- [DOMAIN_SETUP.md](./DOMAIN_SETUP.md) - Detailed domain configuration
- [WEBSOCKET_SETUP.md](./WEBSOCKET_SETUP.md) - WebSocket configuration
- [DETECTION_TESTING.md](./DETECTION_TESTING.md) - Testing guide

---

## Quick Reference Commands

```bash
# Start application
cd /home/$USER/deploy && docker-compose up -d

# Stop application
cd /home/$USER/deploy && docker-compose down

# View logs
cd /home/$USER/deploy && docker-compose logs -f

# Restart application
cd /home/$USER/deploy && docker-compose restart

# Rebuild application
cd /home/$USER/deploy && docker-compose build --no-cache && docker-compose up -d

# Check status
cd /home/$USER/deploy && docker-compose ps

# Run management script
cd /home/$USER/deploy && ./docker-manage.sh [start|stop|restart|logs|status]
```

---

**Last Updated**: January 29, 2026
