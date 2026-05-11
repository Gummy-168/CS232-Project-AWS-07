# 🚀 Deployment Notes

![Project](https://img.shields.io/badge/Project-CS232--Project--AWS--07-blue?style=for-the-badge)
![Backend Port](https://img.shields.io/badge/Backend_Port-8000-lightgrey?style=for-the-badge)
![DB](https://img.shields.io/badge/DB-MySQL_8.0-blue?style=for-the-badge)

---

## Overview

โปรเจกต์ backend นี้รันด้วย **FastAPI + SQLAlchemy + MySQL + Docker**

ไฟล์ deploy ที่เกี่ยวข้องใน repo ปัจจุบัน:

- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `database.py`
- `sql/init.sql`
- `sql/seed.sql`
- `.env.example`

---

## สิ่งที่ต้องรู้ก่อน deploy

- `main.py` รันด้วย `uvicorn` บนพอร์ต `8000`
- Dockerfile ก็ expose และ start ที่พอร์ต `8000`
- `database.py` อ่านค่าจาก environment variables เท่านั้น
- CORS อ่านจาก `ALLOWED_ORIGINS` หรือ `FRONTEND_ORIGIN`
- MySQL ใช้ไฟล์ `sql/init.sql` และ `sql/seed.sql` ตอนสร้าง volume ครั้งแรก

---

## Environment Variables

### ค่าที่ backend ต้องใช้

```env
DB_HOST=db
DB_PORT=3306
DB_NAME=cs232db
DB_USER=root
DB_PASSWORD=password123
ALLOWED_ORIGINS=http://localhost:3000
ENABLE_EMAIL_NOTIFICATION=false
JWT_SECRET_KEY=change-this-secret-in-env
JWT_EXPIRE_MINUTES=60
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxx
```

### หมายเหตุเรื่อง `.env.example`

- ตอนนี้ `.env.example` ใน repo ยังมีค่า `DB_NAME=cs251db`
- แต่ `sql/init.sql` และ `sql/seed.sql` ใช้ฐานข้อมูล `cs232db`
- ถ้าจะรันให้ตรงกับสคีมาปัจจุบัน แนะนำให้ใช้ `DB_NAME=cs232db`

---

## Local Development

### 1) ติดตั้ง dependencies

```bash
pip install -r requirements.txt
```

### 2) รัน backend แบบ local

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3) ตรวจสอบ API

- Root: `http://localhost:8000/`
- Health: `http://localhost:8000/api/health`
- DB test: `http://localhost:8000/api/db-test`
- Swagger: `http://localhost:8000/docs`

---

## Docker

### Dockerfile ปัจจุบัน

- Base image: `python:3.11-slim`
- Expose port: `8000`
- Command: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Build image

```bash
docker build -t classq-backend .
```

### Run container

```bash
docker run -d \
  --name classq-backend \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  classq-backend
```

---

## Docker Compose

### `docker-compose.yml`

มี 2 services:

- `db` = MySQL 8.0
- `backend` = FastAPI backend

### Port mapping

- MySQL: `localhost:3307 -> container:3306`
- Backend: `localhost:8000 -> container:8000`

### MySQL service

- `MYSQL_ROOT_PASSWORD` มาจาก `DB_PASSWORD`
- `MYSQL_DATABASE` มาจาก `DB_NAME`
- mount SQL init files:

```yaml
volumes:
  - mysql_data:/var/lib/mysql
  - ./sql/init.sql:/docker-entrypoint-initdb.d/01-init.sql
  - ./sql/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
```

### Run

```bash
docker compose up --build
```

### Run แบบ background

```bash
docker compose up -d --build
```

### Reset database แล้วรัน init ใหม่

```bash
docker compose down -v
docker compose up -d --build
```

**หมายเหตุ**
- ถ้ามี volume เดิมอยู่ MySQL จะไม่รัน SQL init files ซ้ำ
- คำสั่ง `down -v` จะลบข้อมูลใน volume เดิมทั้งหมด

---

## Default Seed Data

หลังรัน `sql/init.sql` และ `sql/seed.sql` จะมีข้อมูลตัวอย่างสำหรับทดสอบ

### Professor
- email: `prof001@example.com`
- password: `prof1234`

### Students
- email: `stu001@example.com`
- password: `stu1234`
- email: `stu002@example.com`
- password: `stu1234`

### Seed data ตัวอย่าง
- course code: `CS232`
- course name: `Smart Classroom Interaction System`
- sections:
  - `SEC 100001`
  - `SEC 100002`

---

## AWS EC2 Deployment

### Recommended setup

- AMI: Ubuntu Server 22.04 LTS
- Instance type: `t3.micro` สำหรับทดลอง
- Security Group:
  - `22` สำหรับ SSH
  - `8000` สำหรับ backend API

### ติดตั้ง Docker บน EC2

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
```

### Deploy บน EC2

```bash
git clone https://github.com/Gummy-168/CS232-Project-AWS-07.git
cd CS232-Project-AWS-07/backend
cp .env.example .env
nano .env
docker build -t classq-backend .
docker run -d \
  --name classq-backend \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  classq-backend
```

### ตรวจสอบ

```bash
docker ps
docker logs classq-backend
curl http://localhost:8000/api/health
```

---

## Amazon RDS

### ค่าที่ใช้จริง

- Engine: MySQL 8.0
- Database name: `cs232db`
- Port: `3306`

### จุดสำคัญ

- Backend ต่อกับ RDS ผ่าน `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- ถ้าใช้ RDS แทน MySQL container ให้เปลี่ยน `DB_HOST` เป็น endpoint ของ RDS
- Security Group ของ RDS ต้องอนุญาต inbound `3306` จาก EC2 หรือ network ที่ backend ใช้อยู่

### สร้าง schema

ให้รัน `sql/init.sql` ก่อน แล้วค่อย `sql/seed.sql`

---

## Frontend / Amplify

ถ้า frontend ใช้ Amplify ให้ตั้งค่า environment variables ให้ตรงกับ backend ที่ deploy จริง

```env
NEXT_PUBLIC_API_URL=http://<ec2-public-ip>:8000/api
NEXT_PUBLIC_WS_URL=ws://<ec2-public-ip>:8000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

**หมายเหตุ**
- ปัจจุบัน backend ใน repo นี้ไม่มี WebSocket route จริงใน `main.py`
- ถ้า frontend ยังอ้าง `NEXT_PUBLIC_WS_URL` ให้ตรวจสอบก่อนใช้งาน

---

## Troubleshooting

### Backend ไม่ตอบสนอง

```bash
docker ps -a
docker logs classq-backend --tail 50
```

### เชื่อมฐานข้อมูลไม่ได้

- ตรวจว่า `.env` มีค่า `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` ครบ
- ถ้าใช้ Docker Compose ให้ `DB_HOST=db`
- ถ้าใช้ RDS ให้ `DB_HOST` เป็น endpoint ของ RDS

### CORS error

- ตรวจ `ALLOWED_ORIGINS` หรือ `FRONTEND_ORIGIN`
- ค่าใน `ALLOWED_ORIGINS` รองรับหลาย origin โดยคั่นด้วย comma

### อยากให้ SQL init รันใหม่

```bash
docker compose down -v
docker compose up -d --build
```

---

## Quick Checklist

- `DB_NAME` ตรงกับ `sql/init.sql` หรือยัง
- backend รันที่พอร์ต `8000`
- MySQL รันที่ `3307` ในเครื่อง local ผ่าน Docker Compose
- `ALLOWED_ORIGINS` ตรงกับ frontend URL หรือยัง
- ถ้าใช้ Cognito ให้ตรวจ `COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_APP_CLIENT_ID`, `COGNITO_ISSUER`
