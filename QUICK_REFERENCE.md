# Zenzero Platform - Quick Reference

Quick command reference for common operations.

## 🚀 Initial Deployment

### On VPS (Automated)
```bash
wget https://raw.githubusercontent.com/jaroohGit/zenzero-platform/main/deploy-to-vps.sh
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

### Manual Clone and Deploy
```bash
git clone https://github.com/jaroohGit/zenzero-platform.git
cd zenzero-platform
chmod +x *.sh
docker-compose up -d
```

## 🔧 Service Management

### Using docker-manage.sh
```bash
./docker-manage.sh start           # Start all services
./docker-manage.sh stop            # Stop all services  
./docker-manage.sh restart         # Restart all services
./docker-manage.sh logs            # View all logs
./docker-manage.sh logs frontend   # View specific service logs
./docker-manage.sh status          # Check service status
./docker-manage.sh rebuild all     # Rebuild all images
```

### Using docker-compose directly
```bash
docker-compose up -d               # Start services in background
docker-compose down                # Stop and remove containers
docker-compose ps                  # Show running containers
docker-compose logs -f             # Follow all logs
docker-compose logs -f frontend    # Follow specific service logs
docker-compose restart             # Restart all services
docker-compose pull                # Pull latest images
```

## 📦 Update Deployment

### Update from Git
```bash
cd /path/to/zenzero-platform
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Rebuild Specific Service
```bash
docker-compose build frontend      # Rebuild frontend only
docker-compose up -d frontend      # Restart frontend only
```

## 🌐 Domain Setup

### Configure Domain
```bash
# After setting DNS records, run:
sudo ./setup-domain.sh
```

### Check Caddy Status
```bash
sudo systemctl status caddy        # Check if running
sudo systemctl restart caddy       # Restart Caddy
sudo journalctl -u caddy -f        # Follow Caddy logs
caddy reload --config /etc/caddy/Caddyfile  # Reload config
```

## 🔍 Debugging

### Check Service Health
```bash
# Frontend
curl http://localhost:8888

# Backend API
curl http://localhost:3001/status

# MQTT Broker (from container)
docker exec -it deploy-mqtt-broker npm run publisher
```

### View Logs
```bash
# All services
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f frontend
docker-compose logs -f mqtt-broker
docker-compose logs -f timescaledb

# Caddy (if domain setup)
sudo journalctl -u caddy -n 100
```

### Check Ports
```bash
# Show all listening ports
sudo netstat -tuln | grep LISTEN

# Check specific port
sudo lsof -i :8888
sudo lsof -i :1883
```

## 🔥 Firewall

### Configure UFW
```bash
sudo ufw allow 22/tcp              # SSH
sudo ufw allow 80/tcp              # HTTP
sudo ufw allow 443/tcp             # HTTPS
sudo ufw allow 8888/tcp            # Frontend (optional)
sudo ufw allow 1883/tcp            # MQTT (optional)
sudo ufw enable                    # Enable firewall
sudo ufw status                    # Check status
```

## 💾 Database

### Backup
```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker exec deploy-timescaledb pg_dump -U postgres wwt_data > ~/backups/db-backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore
```bash
# Restore from backup
docker exec -i deploy-timescaledb psql -U postgres wwt_data < ~/backups/db-backup-YYYYMMDD-HHMMSS.sql
```

### Connect to Database
```bash
# Open psql shell
docker exec -it deploy-timescaledb psql -U postgres -d wwt_data

# Run query directly
docker exec deploy-timescaledb psql -U postgres -d wwt_data -c "SELECT COUNT(*) FROM sensor_data;"
```

## 🧪 Testing

### Run Tests
```bash
./test-after-deploy.sh             # Post-deployment tests
./quick-test.sh                    # Quick functionality test
./tune-detection.sh                # Detection tests
./run-test-docker.sh               # Docker-based tests
```

## 📊 Monitoring

### System Resources
```bash
# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Process list
htop
```

### Service Status
```bash
# Check all containers
docker ps -a

# Check specific container
docker inspect deploy-frontend

# Check resource usage per container
docker stats deploy-frontend
```

## 🔄 Maintenance

### Clean Up Docker
```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Full cleanup
docker system prune -a -f --volumes
```

### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

## 🆘 Emergency Commands

### Stop Everything
```bash
docker-compose down
sudo systemctl stop caddy
sudo systemctl stop docker
```

### Restart Everything
```bash
sudo systemctl restart docker
docker-compose up -d
sudo systemctl restart caddy
```

### Reset and Rebuild
```bash
# WARNING: This will delete all data!
docker-compose down -v            # Remove containers and volumes
docker-compose build --no-cache   # Rebuild images
docker-compose up -d              # Start fresh
```

## 📁 Important Paths

```
/home/$USER/deploy/               # Deployment directory
/etc/caddy/Caddyfile              # Caddy configuration
/var/log/caddy/                   # Caddy logs
/home/$USER/backups/              # Database backups
~/.ssh/                           # SSH keys
```

## 🔗 Service URLs

**Local Access:**
- Frontend: http://localhost:8888
- Backend API: http://localhost:3001
- MQTT TCP: mqtt://localhost:1883
- MQTT WebSocket: ws://localhost:8084
- WebSocket Bridge: ws://localhost:8085
- Database: localhost:5436

**Public Access (after domain setup):**
- Website: https://www.zenzerobiogas.com
- API: https://www.zenzerobiogas.com/api

## 📚 Documentation Links

- [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) - Complete VPS deployment guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Local development guide
- [DOMAIN_SETUP.md](./DOMAIN_SETUP.md) - Domain and SSL setup
- [WEBSOCKET_SETUP.md](./WEBSOCKET_SETUP.md) - WebSocket configuration
- [DETECTION_TESTING.md](./DETECTION_TESTING.md) - Testing guide

---

**Quick Help:**
- Get server IP: `curl -4 ifconfig.me`
- Check DNS: `dig +short www.zenzerobiogas.com`
- Test SSL: Visit https://www.ssllabs.com/ssltest/
- Check service health: `docker-compose ps`

---

**Last Updated**: January 29, 2026
