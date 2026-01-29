#!/bin/bash

# Zenzero Biogas Platform - VPS Deployment Script
# This script automates the deployment process on a fresh VPS

set -e  # Exit on error

echo "=========================================="
echo "Zenzero Biogas Platform - VPS Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. It's recommended to run as a regular user with sudo access."
    read -p "Continue anyway? (y/n): " continue_root
    if [[ $continue_root != "y" && $continue_root != "Y" ]]; then
        exit 1
    fi
fi

echo ""
print_info "Step 1: System Update"
echo "----------------------------------------"

# Update system packages
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System packages updated"

echo ""
print_info "Step 2: Install Docker"
echo "----------------------------------------"

# Check if Docker is installed
if command -v docker &> /dev/null; then
    print_success "Docker is already installed ($(docker --version))"
else
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm /tmp/get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    print_success "Docker installed successfully"
    print_warning "You may need to log out and log back in for docker group changes to take effect"
fi

echo ""
print_info "Step 3: Install Docker Compose"
echo "----------------------------------------"

# Check if Docker Compose is installed
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose is already installed ($(docker-compose --version))"
else
    print_info "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
fi

echo ""
print_info "Step 4: Install Git"
echo "----------------------------------------"

# Check if Git is installed
if command -v git &> /dev/null; then
    print_success "Git is already installed ($(git --version))"
else
    print_info "Installing Git..."
    sudo apt install git -y
    print_success "Git installed successfully"
fi

echo ""
print_info "Step 5: Install Node.js (Optional)"
echo "----------------------------------------"

read -p "Install Node.js for local development? (y/n): " install_node

if [[ $install_node == "y" || $install_node == "Y" ]]; then
    if command -v node &> /dev/null; then
        print_success "Node.js is already installed ($(node --version))"
    else
        print_info "Installing Node.js 18.x LTS..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
        print_success "Node.js installed successfully ($(node --version))"
        print_success "npm installed successfully ($(npm --version))"
    fi
fi

echo ""
print_info "Step 6: Setup Deployment Directory"
echo "----------------------------------------"

# Get deployment directory from user or use default
read -p "Enter deployment directory [/home/$USER/deploy]: " deploy_dir
deploy_dir=${deploy_dir:-/home/$USER/deploy}

# Create deployment directory if it doesn't exist
if [ ! -d "$deploy_dir" ]; then
    print_info "Creating deployment directory: $deploy_dir"
    mkdir -p "$deploy_dir"
    print_success "Directory created"
else
    print_warning "Directory $deploy_dir already exists"
    read -p "Continue and potentially overwrite existing files? (y/n): " continue_deploy
    if [[ $continue_deploy != "y" && $continue_deploy != "Y" ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

echo ""
print_info "Step 7: Clone Repository"
echo "----------------------------------------"

read -p "Clone from GitHub? (y/n): " clone_repo

if [[ $clone_repo == "y" || $clone_repo == "Y" ]]; then
    cd "$deploy_dir"
    
    # Check if directory is empty or has .git
    if [ -d ".git" ]; then
        print_warning "Git repository already exists"
        read -p "Pull latest changes? (y/n): " pull_changes
        if [[ $pull_changes == "y" || $pull_changes == "Y" ]]; then
            git pull
            print_success "Repository updated"
        fi
    else
        read -p "Enter GitHub repository URL [https://github.com/jaroohGit/zenzero-platform.git]: " repo_url
        repo_url=${repo_url:-https://github.com/jaroohGit/zenzero-platform.git}
        
        print_info "Cloning repository from $repo_url..."
        
        # Check if directory is empty
        if [ "$(ls -A $deploy_dir)" ]; then
            print_warning "Directory is not empty. Cloning to temporary directory first..."
            git clone "$repo_url" /tmp/zenzero-temp
            rsync -av /tmp/zenzero-temp/ "$deploy_dir/"
            rm -rf /tmp/zenzero-temp
        else
            git clone "$repo_url" .
        fi
        
        print_success "Repository cloned successfully"
    fi
else
    print_warning "Skipping repository clone"
    print_info "Please upload your files manually to $deploy_dir"
    read -p "Press Enter when files are uploaded..."
fi

echo ""
print_info "Step 8: Make Scripts Executable"
echo "----------------------------------------"

cd "$deploy_dir"
if [ -f "docker-manage.sh" ]; then
    chmod +x *.sh 2>/dev/null || true
    chmod +x backend/*.sh 2>/dev/null || true
    print_success "Shell scripts made executable"
else
    print_warning "No shell scripts found in $deploy_dir"
fi

echo ""
print_info "Step 9: Configure Environment"
echo "----------------------------------------"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_info "Creating .env file..."
    cat > .env << EOF
# Zenzero Biogas Platform Environment Configuration

# Database Configuration
DB_HOST=timescaledb
DB_PORT=5432
DB_NAME=wwt_data
DB_USER=postgres
DB_PASSWORD=postgres

# MQTT Configuration
MQTT_BROKER=mqtt://localhost:1883

# WebSocket Configuration
WS_PORT=8085

# API Configuration
API_PORT=3002

# Publisher Configuration
START_PUBLISHER=true

# Add your custom configuration below:

EOF
    chmod 600 .env
    print_success ".env file created"
    print_warning "Please review and update .env file with your configuration"
else
    print_success ".env file already exists"
fi

echo ""
print_info "Step 10: Setup Firewall"
echo "----------------------------------------"

read -p "Configure firewall with UFW? (y/n): " setup_firewall

if [[ $setup_firewall == "y" || $setup_firewall == "Y" ]]; then
    # Install UFW if not installed
    if ! command -v ufw &> /dev/null; then
        print_info "Installing UFW..."
        sudo apt install ufw -y
    fi
    
    print_info "Configuring firewall rules..."
    
    # Allow SSH (critical - do this first!)
    sudo ufw allow 22/tcp comment 'SSH'
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    
    # Optionally allow direct access to services
    read -p "Allow direct access to frontend (port 8888)? (y/n): " allow_frontend
    if [[ $allow_frontend == "y" || $allow_frontend == "Y" ]]; then
        sudo ufw allow 8888/tcp comment 'Frontend'
    fi
    
    read -p "Allow public access to MQTT (port 1883)? (y/n): " allow_mqtt
    if [[ $allow_mqtt == "y" || $allow_mqtt == "Y" ]]; then
        sudo ufw allow 1883/tcp comment 'MQTT'
    fi
    
    # Enable UFW if not already enabled
    if ! sudo ufw status | grep -q "Status: active"; then
        print_warning "UFW is not active. Enabling now..."
        sudo ufw --force enable
    fi
    
    print_success "Firewall configured"
    sudo ufw status numbered
fi

echo ""
print_info "Step 11: Start Docker Services"
echo "----------------------------------------"

cd "$deploy_dir"

read -p "Start Docker services now? (y/n): " start_services

if [[ $start_services == "y" || $start_services == "Y" ]]; then
    print_info "Starting Docker services..."
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in $deploy_dir"
        exit 1
    fi
    
    # Start services
    docker-compose up -d
    
    # Wait a few seconds for services to start
    sleep 5
    
    # Check service status
    print_success "Services started. Current status:"
    docker-compose ps
    
    echo ""
    print_info "Checking service health..."
    
    # Test frontend
    if curl -s http://localhost:8888 > /dev/null; then
        print_success "Frontend is accessible at http://localhost:8888"
    else
        print_warning "Frontend might not be ready yet. Check logs with: docker-compose logs frontend"
    fi
    
    # Test backend API
    if curl -s http://localhost:3001/status > /dev/null; then
        print_success "Backend API is accessible at http://localhost:3001"
    else
        print_warning "Backend API might not be ready yet. Check logs with: docker-compose logs mqtt-broker"
    fi
else
    print_info "Skipping service startup"
    print_info "You can start services later with: cd $deploy_dir && docker-compose up -d"
fi

echo ""
print_info "Step 12: Domain Configuration"
echo "----------------------------------------"

read -p "Configure domain and SSL now? (y/n): " setup_domain

if [[ $setup_domain == "y" || $setup_domain == "Y" ]]; then
    if [ -f "setup-domain.sh" ]; then
        print_info "Running domain setup script..."
        sudo ./setup-domain.sh
    else
        print_warning "setup-domain.sh not found"
        print_info "Please run domain setup manually later"
    fi
else
    print_info "Skipping domain setup"
    print_info "You can run domain setup later with: cd $deploy_dir && sudo ./setup-domain.sh"
fi

echo ""
echo "=========================================="
print_success "Deployment Complete!"
echo "=========================================="
echo ""

print_info "Summary:"
echo "  Deployment Directory: $deploy_dir"
echo "  Docker Status: $(docker --version)"
echo "  Docker Compose Status: $(docker-compose --version)"
echo ""

if docker-compose ps 2>/dev/null | grep -q "Up"; then
    print_success "Services are running!"
    echo ""
    echo "  Access URLs:"
    echo "    Frontend: http://$(curl -4 -s ifconfig.me):8888"
    echo "    Backend API: http://$(curl -4 -s ifconfig.me):3001"
    echo ""
fi

print_info "Useful Commands:"
echo "  cd $deploy_dir && ./docker-manage.sh status   # Check service status"
echo "  cd $deploy_dir && ./docker-manage.sh logs     # View logs"
echo "  cd $deploy_dir && ./docker-manage.sh restart  # Restart services"
echo "  cd $deploy_dir && docker-compose ps            # Show running containers"
echo ""

print_info "Next Steps:"
echo "  1. Configure your domain DNS (see DOMAIN_SETUP.md)"
echo "  2. Run: cd $deploy_dir && sudo ./setup-domain.sh"
echo "  3. Access your application via HTTPS"
echo ""

print_info "Documentation:"
echo "  VPS_DEPLOYMENT.md - Full deployment guide"
echo "  DOMAIN_SETUP.md - Domain configuration guide"
echo "  DEVELOPMENT.md - Development guide"
echo ""

print_success "Happy deploying! 🚀"
echo ""
