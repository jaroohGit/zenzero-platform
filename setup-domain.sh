#!/bin/bash

echo "=========================================="
echo "Setup Domain Access for ZenZero Biogas"
echo "=========================================="
echo ""

# Check if Caddy is installed
if ! command -v caddy &> /dev/null; then
    echo "📦 Installing Caddy Server..."
    
    # Install Caddy (Debian/Ubuntu)
    if [ -f /etc/debian_version ]; then
        sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
        sudo apt update
        sudo apt install caddy
    else
        echo "❌ This script supports Debian/Ubuntu only"
        echo "Please install Caddy manually: https://caddyserver.com/docs/install"
        exit 1
    fi
else
    echo "✅ Caddy is already installed"
fi

echo ""
echo "=========================================="
echo "🌐 Domain Configuration Required"
echo "=========================================="
echo ""
echo "Before continuing, you MUST configure your DNS:"
echo ""
echo "1. Go to your domain registrar (GoDaddy, Namecheap, etc.)"
echo "2. Add these DNS A records:"
echo ""
echo "   Host: @"
echo "   Type: A"
echo "   Value: $(curl -4 -s ifconfig.me)"
echo "   TTL: 3600"
echo ""
echo "   Host: www"
echo "   Type: A"
echo "   Value: $(curl -4 -s ifconfig.me)"
echo "   TTL: 3600"
echo ""
echo "3. Wait 5-30 minutes for DNS propagation"
echo ""
echo "=========================================="
echo ""

read -p "Have you configured DNS? (y/n): " dns_configured

if [[ $dns_configured != "y" && $dns_configured != "Y" ]]; then
    echo "❌ Please configure DNS first, then run this script again"
    exit 1
fi

echo ""
echo "📋 Checking DNS configuration..."
echo ""

# Check if domain resolves to this server
DOMAIN_IP=$(dig +short www.zenzerobiogas.com | tail -n1)
SERVER_IP=$(curl -4 -s ifconfig.me)

echo "Domain IP: $DOMAIN_IP"
echo "Server IP: $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "⚠️  Warning: Domain does not point to this server yet"
    echo "DNS propagation may take up to 48 hours"
    read -p "Continue anyway? (y/n): " continue_anyway
    if [[ $continue_anyway != "y" && $continue_anyway != "Y" ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Starting Caddy with domain configuration..."
echo ""

# Create log directory
sudo mkdir -p /var/log/caddy
sudo chown $(whoami):$(whoami) /var/log/caddy

# Stop any existing Caddy process
sudo systemctl stop caddy 2>/dev/null || true

# Copy Caddyfile to Caddy config location
sudo cp Caddyfile /etc/caddy/Caddyfile

# Start Caddy service
sudo systemctl enable caddy
sudo systemctl start caddy

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Your website should now be accessible at:"
echo "🌐 https://www.zenzerobiogas.com"
echo "🌐 https://zenzerobiogas.com (redirects to www)"
echo ""
echo "📝 Useful commands:"
echo "   sudo systemctl status caddy   # Check Caddy status"
echo "   sudo systemctl restart caddy  # Restart Caddy"
echo "   sudo journalctl -u caddy -f   # View Caddy logs"
echo "   caddy reload --config /etc/caddy/Caddyfile  # Reload config"
echo ""
echo "🔒 SSL Certificate:"
echo "   Caddy will automatically obtain and renew SSL certificates"
echo "   from Let's Encrypt (may take 1-2 minutes on first access)"
echo ""
echo "=========================================="
