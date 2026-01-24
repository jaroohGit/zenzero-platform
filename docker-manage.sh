#!/bin/bash
# Deploy Docker Management Script

case "$1" in
  start)
    echo "🚀 Starting Zenzero Biogas Deploy..."
    cd /home/teddy/deploy
    docker-compose up -d
    echo "✅ Services started!"
    docker-compose ps
    ;;
  
  stop)
    echo "🛑 Stopping Zenzero Biogas..."
    cd /home/teddy/deploy
    docker-compose down
    echo "✅ Services stopped!"
    ;;
  
  restart)
    echo "🔄 Restarting Zenzero Biogas..."
    cd /home/teddy/deploy
    docker-compose restart
    echo "✅ Services restarted!"
    ;;
  
  logs)
    if [ -z "$2" ]; then
      echo "📋 Showing all logs..."
      cd /home/teddy/deploy
      docker-compose logs -f --tail=50
    else
      echo "📋 Showing logs for $2..."
      cd /home/teddy/deploy
      docker-compose logs -f --tail=50 $2
    fi
    ;;
  
  status)
    echo "📊 Zenzero Biogas Status:"
    cd /home/teddy/deploy
    docker-compose ps
    ;;
  
  rebuild)
    SERVICE=${2:-all}
    if [ "$SERVICE" = "all" ]; then
      echo "🔨 Rebuilding all images..."
      cd /home/teddy/deploy/frontend
      docker build -t deploy-frontend:latest .
      cd /home/teddy/deploy
      docker-compose build backend
    elif [ "$SERVICE" = "frontend" ]; then
      echo "🔨 Rebuilding frontend..."
      cd /home/teddy/deploy/frontend
      docker build -t deploy-frontend:latest .
    elif [ "$SERVICE" = "backend" ]; then
      echo "🔨 Rebuilding backend..."
      cd /home/teddy/deploy
      docker-compose build backend
    fi
    echo "✅ Images rebuilt!"
    ;;
  
  *)
    echo "Zenzero Biogas Docker Manager"
    echo ""
    echo "Usage: $0 {start|stop|restart|logs|status|rebuild} [service]"
    echo ""
    echo "Commands:"
    echo "  start            - Start all services"
    echo "  stop             - Stop all services"
    echo "  restart          - Restart all services"
    echo "  logs [service]   - Show logs (optional: specify service)"
    echo "  status           - Show service status"
    echo "  rebuild [service] - Rebuild images (all|frontend|backend)"
    exit 1
    ;;
esac

exit 0
