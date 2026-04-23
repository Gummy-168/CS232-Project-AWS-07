# CS232 Project Backend

Backend ของโปรเจกต์ CS232 พัฒนาด้วย `FastAPI`, `SQLAlchemy`, `MySQL` และ `Docker`

โปรเจกต์นี้รองรับการรัน 2 แบบ

- `Local`: รัน FastAPI จากเครื่องของเราเอง
- `Docker Compose`: รัน Backend และ MySQL พร้อมกันในครั้งเดียว

เป้าหมายของ README นี้คือให้สมาชิกในทีมเปิดมาแล้วเริ่มใช้งานต่อได้ทันที

## Overview

ตอนนี้ระบบสามารถทำงานได้ดังนี้

- รัน FastAPI backend ได้
- เชื่อมต่อ MySQL ได้
- รันผ่าน Docker Compose ได้
- ทดสอบ API ผ่าน Swagger Docs ได้
- Frontend เรียก backend ได้จาก `http://localhost:3000`

## Tech Stack

- Frontend: `Next.js`
- Backend: `FastAPI`
- Database: `MySQL`
- ORM: `SQLAlchemy`
- Container: `Docker` / `Docker Compose`

## Project Structure

```text
backend/
├── database.py
├── Dockerfile
├── docker-compose.yml
├── main.py
├── models.py
├── requirements.txt
├── .env.example
└── README.md
```

## Available Endpoints

### `GET /`

ใช้ตรวจสอบว่า backend รันอยู่

ตัวอย่าง response:

```json
{
  "message": "Backend is running"
}
```

### `GET /api/db-test`

ใช้ตรวจสอบว่า backend เชื่อมต่อ MySQL ได้สำเร็จ

ตัวอย่าง response:

```json
{
  "message": "MySQL connected successfully"
}
```

## Requirements

### สำหรับการรันแบบ Local

- Python 3.11 ขึ้นไป
- `pip`
- MySQL (กรณีจะเชื่อมกับฐานข้อมูลที่ติดตั้งในเครื่อง)

### สำหรับการรันแบบ Docker

- Docker Desktop

## Environment Setup

สร้างไฟล์ `.env` จาก `.env.example` ก่อนเริ่มใช้งาน

### Windows Command Prompt

```bash
copy .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

### macOS / Linux / Git Bash

```bash
cp .env.example .env
```

### ตัวอย่างค่าใน `.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cs232db
DB_USER=root
DB_PASSWORD=1234
```

### หมายเหตุเรื่อง `DB_HOST` และ `DB_PORT`

- ถ้ารันด้วย `docker compose` ให้ backend ใช้ `DB_HOST=db` และ `DB_PORT=3306`
- ถ้ารันแบบ local แล้ว MySQL อยู่ในเครื่อง ให้ใช้ `DB_HOST=localhost`
- ใน `docker-compose.yml` ตอนนี้มีการ map port ของ MySQL เป็น `3307:3306`
  ดังนั้นถ้าจะต่อเข้าฐานข้อมูลจากเครื่องภายนอก container ให้ใช้ port `3307`

## Quick Start

ถ้าต้องการเริ่มใช้งานเร็วที่สุด แนะนำให้ใช้ Docker Compose

```bash
docker compose up --build
```

หลังจากรันสำเร็จ ให้เปิด:

- API: `http://localhost:8000/`
- Swagger Docs: `http://localhost:8000/docs`

## Run Locally

### 1. ติดตั้ง dependencies

```bash
pip install -r requirements.txt
```

### 2. ตั้งค่า `.env`

ตรวจสอบให้แน่ใจว่า `.env` มีค่าถูกต้องสำหรับฐานข้อมูลที่ใช้งานอยู่

### 3. รัน FastAPI

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. ทดสอบการทำงาน

- API: `http://localhost:8000/`
- Swagger Docs: `http://localhost:8000/docs`

หมายเหตุ:
หากคุณรัน backend ผ่าน Docker Compose อยู่แล้ว ไม่ต้องเปิด `uvicorn` ซ้ำ

## Run With Docker

กรณีต้องการรันเฉพาะ backend image

### Build image

```bash
docker build -t backend-cs232 .
```

### Run container

```bash
docker run -d -p 8000:8000 --name backend-container backend-cs232
```

หลังจากรันแล้ว ให้เปิด:

- API: `http://localhost:8000/`
- Swagger Docs: `http://localhost:8000/docs`

หมายเหตุ:
วิธีนี้ยังต้องมี MySQL ที่ backend เชื่อมต่อได้อยู่แล้ว

## Run With Docker Compose

แนะนำสำหรับการพัฒนาในทีม เพราะจะรันทั้ง Backend และ MySQL พร้อมกัน

### Run แบบปกติ

```bash
docker compose up --build
```

### Run แบบ background

```bash
docker compose up --build -d
```

### Stop services

```bash
docker compose down
```

## View Logs

### ดู log ของ backend

```bash
docker compose logs backend
```

### ดู log ของ MySQL

```bash
docker compose logs db
```

## How To Test

หลังจากระบบรันแล้ว ให้เปิด Swagger Docs:

```text
http://localhost:8000/docs
```

จากนั้นทดสอบ endpoint:

- `GET /`
- `GET /api/db-test`

ถ้าเชื่อมต่อฐานข้อมูลสำเร็จ จะได้ผลลัพธ์ประมาณนี้:

```json
{
  "message": "MySQL connected successfully"
}
```

## Frontend Integration

ปัจจุบัน backend อนุญาต CORS สำหรับ:

- `http://localhost:3000`

ดังนั้น frontend ที่รันบนพอร์ตนี้สามารถเรียก backend ได้โดยตรง

## Setup For Team Members

สำหรับคนที่เพิ่ง clone โปรเจกต์มา ให้ทำตามนี้

### 1. Clone repository

```bash
git clone <repo-url>
cd backend
```

### 2. สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

ถ้าใช้ Windows Command Prompt:

```bash
copy .env.example .env
```

### 3. เปิด Docker Desktop

ตรวจสอบว่า Docker พร้อมใช้งานก่อน

### 4. รันระบบ

```bash
docker compose up --build
```

หรือรันแบบ background:

```bash
docker compose up --build -d
```

### 5. ทดสอบระบบ

- Backend Docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`

## Useful Commands

### ตรวจสอบ Docker version

```bash
docker version
```

### ดู container ที่กำลังรันอยู่

```bash
docker ps
```

### ดูสถานะของ Docker Compose

```bash
docker compose ps
```

## Current Status

สถานะล่าสุดของ backend ตอนนี้

- Backend รันได้
- Database เชื่อมได้
- Docker Compose ใช้งานได้
- Swagger ใช้งานได้
- Frontend เรียก backend ได้

## Important Notes

- ไม่ควร push ไฟล์ `.env` ขึ้น Git
- ไม่ควร push virtual environment เช่น `myenv/`
- ไม่ควร push `__pycache__/`
- ถ้าใช้ Docker Compose เป็นหลัก สมาชิกในทีมไม่จำเป็นต้องติดตั้ง MySQL แยกในเครื่อง
- ถ้ารัน backend ผ่าน Docker Compose แล้ว ไม่ต้องเปิด `uvicorn` ซ้ำ

## Next Steps

สิ่งที่เหมาะจะพัฒนาต่อจากจุดนี้

- เพิ่ม model และ table จริง
- พัฒนา CRUD endpoints
- เชื่อม flow ระหว่าง frontend และ backend ให้ครบ
- เตรียม deployment ขึ้น AWS
