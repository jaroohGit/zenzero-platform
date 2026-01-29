# Development Guide

## การพัฒนาบนเครื่องโดยตรง (Local Development)

### ข้อกำหนด
- Node.js 18+ ติดตั้งแล้ว
- PostgreSQL/TimescaleDB (หรือใช้ Docker สำหรับ database อย่างเดียว)

---

## Frontend Development

### 1. ติดตั้ง Dependencies
```bash
cd /home/teddy/deploy/frontend
npm install
```

### 2. รัน Development Server
```bash
npm run dev
```

Frontend จะเปิดที่: **http://localhost:5173**

### คุณสมบัติ
- ✨ Hot Module Replacement (HMR)
- 🔄 Auto-reload เมื่อแก้ไขไฟล์
- 🎨 Tailwind CSS พร้อม JIT mode

---

## Backend Development

### 1. ติดตั้ง Dependencies
```bash
cd /home/teddy/deploy/backend
npm install
```

### 2. เริ่ม Database (ถ้ายังไม่มี)
```bash
# ใช้ Docker สำหรับ database อย่างเดียว
docker run -d \
  --name deploy-db \
  -p 5436:5432 \
  -e POSTGRES_DB=wwt_data \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -v $(pwd)/database:/docker-entrypoint-initdb.d \
  timescale/timescaledb:latest-pg15
```

### 3. รัน Backend Services

#### MQTT Broker
```bash
npm run start
# หรือ development mode พร้อม auto-restart
npm run dev
```

#### WebSocket Server
```bash
npm run websocket
```

#### MQTT Publisher (สำหรับทดสอบ)
```bash
npm run publisher
```

#### MQTT Subscriber
```bash
npm run subscriber
# หรือ
npm run subscriber-wwt02
```

---

## การรัน Development แบบเต็ม

### Terminal 1: Database
```bash
docker run -d --name deploy-db -p 5436:5432 \
  -e POSTGRES_DB=wwt_data \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  timescale/timescaledb:latest-pg15
```

### Terminal 2: Backend
```bash
cd /home/teddy/deploy/backend
npm install
npm run dev
```

### Terminal 3: Frontend
```bash
cd /home/teddy/deploy/frontend
npm install
npm run dev
```

### Services URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MQTT Broker**: mqtt://localhost:1883
- **MQTT WebSocket**: ws://localhost:8083
- **WebSocket Bridge**: ws://localhost:8085
- **Database**: localhost:5436

---

## การแก้ไขและทดสอบ

### Frontend
1. แก้ไขไฟล์ใน `frontend/src/`
2. บันทึกไฟล์ → เห็นผลทันทีใน browser
3. ไม่ต้อง refresh browser (HMR)

### Backend
1. แก้ไขไฟล์ใน `backend/`
2. บันทึกไฟล์
3. ถ้าใช้ `npm run dev` (nodemon) จะ restart อัตโนมัติ
4. ถ้าใช้ `npm run start` ต้อง restart ด้วยตัวเอง (Ctrl+C แล้วรันใหม่)

---

## Troubleshooting

### Port ถูกใช้งานแล้ว
```bash
# ตรวจสอบและปิด process
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:1883 | xargs kill -9  # MQTT
```

### Database Connection Error
```bash
# ตรวจสอบว่า database container รันอยู่
docker ps | grep deploy-db

# ดู logs
docker logs deploy-db

# Restart database
docker restart deploy-db
```

### ติดตั้ง dependencies ไม่สำเร็จ
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Deploy to VPS (Recommended)

For complete VPS deployment with automated setup:
```bash
# Run the deployment script on your VPS
./deploy-to-vps.sh
```

See the comprehensive guide: [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)

### Manual Docker Deployment

สำหรับ deploy จริง ใช้:
```bash
docker-compose up -d
```

อ่านเพิ่มเติมที่:
- [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) - **Complete VPS deployment guide**
- [DOMAIN_SETUP.md](./DOMAIN_SETUP.md) - Domain and SSL configuration
- [WEBSOCKET_SETUP.md](./WEBSOCKET_SETUP.md) - WebSocket setup

---

## Git Workflow

### สร้าง branch ใหม่
```bash
git checkout -b feature-name
```

### Commit การเปลี่ยนแปลง
```bash
git add .
git commit -m "คำอธิบายการแก้ไข"
```

### Push ไป GitHub
```bash
git push origin feature-name
```

### Merge เข้า main
1. ไปที่ GitHub repository
2. สร้าง Pull Request
3. Review และ merge
