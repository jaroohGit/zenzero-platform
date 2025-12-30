# Development Environment Guide

## การรัน Development Environment บน localhost

### ข้อกำหนด
- Docker และ Docker Compose ติดตั้งแล้ว
- Port ที่ใช้งาน: 5173 (Frontend), 1883 (MQTT), 8084 (MQTT WS), 3001 (API), 8085 (WS Bridge), 5436 (Database)

### วิธีการใช้งาน

#### 1. เริ่มต้น Development Environment
```bash
# เริ่มต้นทั้งหมด
docker-compose -f docker-compose.dev.yml up

# หรือรันในโหมด background
docker-compose -f docker-compose.dev.yml up -d

# ดู logs
docker-compose -f docker-compose.dev.yml logs -f
```

#### 2. เข้าถึง Services
- **Frontend (Vite Dev Server)**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MQTT Broker**: mqtt://localhost:1883
- **MQTT WebSocket**: ws://localhost:8084
- **WebSocket Bridge**: ws://localhost:8085
- **TimescaleDB**: postgresql://postgres:postgres@localhost:5436/wwt_data

#### 3. การแก้ไขโค้ด
- แก้ไขไฟล์ใน `frontend/` จะมี **hot-reload** อัตโนมัติ
- แก้ไขไฟล์ใน `backend/` จะมี **auto-restart** ผ่าน nodemon
- ไม่ต้อง rebuild Docker images หลังแก้ไข

#### 4. หยุดการทำงาน
```bash
# หยุด services
docker-compose -f docker-compose.dev.yml down

# หยุดและลบ volumes (database data)
docker-compose -f docker-compose.dev.yml down -v
```

#### 5. Rebuild (เมื่อเพิ่ม dependencies ใหม่)
```bash
# Rebuild images
docker-compose -f docker-compose.dev.yml build

# Rebuild และเริ่มใหม่
docker-compose -f docker-compose.dev.yml up --build
```

### การแก้ไขและทดสอบ

#### Frontend
1. แก้ไขไฟล์ใน `frontend/src/`
2. เปิด browser ที่ http://localhost:5173
3. เห็นการเปลี่ยนแปลงทันที (hot-reload)

#### Backend
1. แก้ไขไฟล์ใน `backend/`
2. Server จะ restart อัตโนมัติ (nodemon)
3. ทดสอบผ่าน API endpoint หรือ MQTT client

### การดู Logs แยกแต่ละ Service
```bash
# Frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend-dev

# Backend logs
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# Database logs
docker-compose -f docker-compose.dev.yml logs -f timescaledb-dev
```

### Troubleshooting

#### Port ถูกใช้งานแล้ว
```bash
# ตรวจสอบ port ที่ใช้งาน
sudo lsof -i :5173
sudo lsof -i :3001

# หยุด process ที่ใช้ port
sudo kill -9 <PID>
```

#### ต้องการ rebuild ทั้งหมด
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

#### เข้าถึง container shell
```bash
# Frontend
docker exec -it deploy-frontend-dev sh

# Backend
docker exec -it deploy-backend-dev sh

# Database
docker exec -it deploy-timescaledb-dev psql -U postgres -d wwt_data
```

## Production vs Development

### Production (docker-compose.yml)
- ใช้สำหรับ deploy จริง
- Build แบบ optimized
- ไม่มี hot-reload
- Port: 8888 (Frontend)

### Development (docker-compose.dev.yml)
- ใช้สำหรับพัฒนาบน localhost
- มี hot-reload และ auto-restart
- Volume mount สำหรับแก้ไขโค้ดแบบ real-time
- Port: 5173 (Frontend)

## เคล็ดลับ

1. **ใช้ terminal หลายตัว**: เปิด terminal แยกสำหรับดู logs แต่ละ service
2. **Browser DevTools**: ใช้ Network tab ดู API calls และ WebSocket connections
3. **MQTT Client**: ใช้ MQTT Explorer หรือ mosquitto_pub/sub เพื่อทดสอบ MQTT
4. **Database GUI**: ใช้ pgAdmin หรือ DBeaver เชื่อมต่อที่ localhost:5436

## การ Commit และ Push

หลังจากแก้ไขเสร็จแล้ว:
```bash
git add .
git commit -m "描述การแก้ไข"
git push origin developer
```

จากนั้นสามารถสร้าง Pull Request บน GitHub เพื่อ merge เข้า main branch
