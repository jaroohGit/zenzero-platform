FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose ports
EXPOSE 1883 8083 3001 8085

# Start all services
CMD ["./start.sh"]
