# Zenzero Biogas Platform

A comprehensive IoT platform for monitoring and managing biogas systems with real-time data collection, MQTT communication, and web-based visualization.

## 🚀 Quick Start

### For VPS Deployment (Production)

Deploy to a VPS in minutes:

```bash
# On your VPS, run the automated deployment script
wget https://raw.githubusercontent.com/jaroohGit/zenzero-platform/main/deploy-to-vps.sh
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

Or manually:

```bash
# Clone the repository
git clone https://github.com/jaroohGit/zenzero-platform.git
cd zenzero-platform

# Run deployment script
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

📖 **See [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) for detailed instructions**

### For Local Development

```bash
# Start all services with Docker
docker-compose up -d

# Or use the management script
./docker-manage.sh start
```

📖 **See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide**

## 📚 Documentation

- **[VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)** - Complete guide for deploying to a VPS and running shell scripts
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick command reference for common operations
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Local development setup and workflow
- **[DOMAIN_SETUP.md](./DOMAIN_SETUP.md)** - Configure custom domain with SSL
- **[WEBSOCKET_SETUP.md](./WEBSOCKET_SETUP.md)** - WebSocket configuration guide
- **[DETECTION_TESTING.md](./DETECTION_TESTING.md)** - Testing and detection setup

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Internet                      │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   Caddy (SSL/TLS)   │  Port 443/80
          │   Reverse Proxy     │
          └──────────┬──────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐    ┌────▼────┐    ┌────▼────┐
│ Frontend│    │  MQTT   │    │  WebSocket│
│ (Vue.js)│    │ Broker  │    │  Bridge   │
│Port 8888│    │Port 1883│    │ Port 8085 │
└─────────┘    └────┬────┘    └───────────┘
                    │
               ┌────▼────┐
               │TimescaleDB│
               │  Port 5432│
               └──────────┘
```

## 🛠️ Technology Stack

### Frontend
- Vue.js 3 with Vite
- Tailwind CSS
- Real-time WebSocket connections
- Responsive design

### Backend
- Node.js
- Aedes MQTT Broker
- Express.js API
- WebSocket server

### Database
- TimescaleDB (PostgreSQL extension)
- Time-series data optimization

### Infrastructure
- Docker & Docker Compose
- Caddy web server (auto SSL)
- Ubuntu/Debian Linux

## 🎯 Features

- ✨ Real-time IoT data collection via MQTT
- 📊 Time-series data storage with TimescaleDB
- 🌐 Web-based monitoring dashboard
- 🔒 Automatic SSL certificate management
- 🚀 Easy deployment with Docker
- 📱 Responsive mobile interface
- 🔌 WebSocket support for live updates
- 🔍 Detection and testing tools

## 🔧 Shell Scripts

The platform includes several management scripts:

### `deploy-to-vps.sh`
Automated VPS deployment script that:
- Installs Docker and dependencies
- Clones the repository
- Configures firewall
- Starts services

```bash
./deploy-to-vps.sh
```

### `docker-manage.sh`
Service management script:

```bash
./docker-manage.sh start      # Start all services
./docker-manage.sh stop       # Stop all services
./docker-manage.sh restart    # Restart services
./docker-manage.sh logs       # View logs
./docker-manage.sh status     # Check status
./docker-manage.sh rebuild    # Rebuild images
```

### `setup-domain.sh`
Domain and SSL configuration:

```bash
sudo ./setup-domain.sh
```

### Testing Scripts
- `test-after-deploy.sh` - Post-deployment tests
- `quick-test.sh` - Quick functionality test
- `tune-detection.sh` - Detection tuning
- `run-test-docker.sh` - Docker-based tests

## 📦 Services

### Frontend (Port 8888)
Web interface for monitoring and control
- Built with Vue.js and Vite
- Served via Nginx in Docker

### MQTT Broker (Port 1883)
Message broker for IoT devices
- MQTT TCP: Port 1883
- MQTT WebSocket: Port 8084
- HTTP API: Port 3001

### WebSocket Bridge (Port 8085)
Real-time data bridge between MQTT and web clients

### TimescaleDB (Port 5436)
Time-series database for sensor data storage

## 🔒 Security

- Automatic HTTPS with Let's Encrypt
- Firewall configuration with UFW
- Environment variable management
- Docker network isolation
- Regular security updates

## 📊 Monitoring

Check service status:

```bash
# Docker services
docker-compose ps

# Service logs
docker-compose logs -f

# System resources
docker stats

# Caddy logs (if domain setup)
sudo journalctl -u caddy -f
```

## 🔄 Updating

Pull latest changes and rebuild:

```bash
cd /path/to/zenzero-platform
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

Or use the management script:

```bash
./docker-manage.sh rebuild all
```

## 🐛 Troubleshooting

Common issues and solutions are documented in:
- [VPS_DEPLOYMENT.md#troubleshooting](./VPS_DEPLOYMENT.md#troubleshooting)
- [DOMAIN_SETUP.md#troubleshooting](./DOMAIN_SETUP.md#troubleshooting)

Quick checks:

```bash
# Check if services are running
docker-compose ps

# View service logs
docker-compose logs -f [service-name]

# Restart services
./docker-manage.sh restart

# Check firewall
sudo ufw status
```

## 💾 Backup

Backup your database:

```bash
# Create backup
docker exec deploy-timescaledb pg_dump -U postgres wwt_data > backup.sql

# Restore backup
docker exec -i deploy-timescaledb psql -U postgres wwt_data < backup.sql
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the documentation in the `/docs` folder
- Review existing issues and discussions

## 🙏 Acknowledgments

- Built with Vue.js, Node.js, and TimescaleDB
- Uses Caddy for automatic HTTPS
- Powered by Docker for easy deployment

---

**Quick Links:**
- [Deploy to VPS](./VPS_DEPLOYMENT.md) 🚀
- [Quick Reference](./QUICK_REFERENCE.md) ⚡
- [Local Development](./DEVELOPMENT.md) 💻
- [Domain Setup](./DOMAIN_SETUP.md) 🌐
- [Testing Guide](./DETECTION_TESTING.md) 🧪

---

**Last Updated**: January 29, 2026
