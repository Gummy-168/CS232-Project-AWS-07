<p align="center">
  <h1>CS232-Project-AWS-07</h1>
  ระบบส่งเสริมการมีส่วนร่วมและติดตามคำถามในชั้นเรียนแบบอัจฉริยะ (Smart Classrooms)
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,ts,python,docker,mysql,aws,githubactions" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat" />
  <img src="https://img.shields.io/badge/cloud-AWS-FF9900?style=flat&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/architecture-cloud--native-8B5CF6?style=flat" />
  <img src="https://img.shields.io/github/issues/Gummy-168/CS232-Project-AWS-07?style=flat&label=Open%20Issues&color=E11D48" />
  <img src="https://img.shields.io/github/issues-closed/Gummy-168/CS232-Project-AWS-07?style=flat&label=Closed%20Issues&color=16A34A" />
</p>

---

> วิชา CS232 Introduction to Cloud Computing Technology
> มหาวิทยาลัยธรรมศาสตร์
> กลุ่ม 7 | ภาคเรียนที่ 2/2568

---

## 📌 Overview

ในการเรียนการสอนในห้องเรียน นักศึกษาจำนวนมากไม่กล้าถามคำถามต่อหน้าชั้นเรียนเนื่องจากความเขินอาย ความไม่มั่นใจ หรือความกังวลว่าคำถามของตนอาจรบกวนผู้อื่น ส่งผลให้อาจารย์ไม่ทราบว่านักศึกษาคนใดยังไม่เข้าใจเนื้อหา และการติดตามการมีส่วนร่วมในห้องเรียนขนาดใหญ่ทำได้ยาก

ระบบนี้ถูกพัฒนาขึ้นภายใต้ธีม **Smart Classrooms** เพื่อแก้ปัญหาดังกล่าว โดยเปิดโอกาสให้นักศึกษาส่งคำถามผ่านระบบได้สะดวกขึ้น และช่วยให้อาจารย์ติดตาม ตอบคำถาม วิเคราะห์การมีส่วนร่วม และดูรายงานสรุปผ่าน Dashboard ได้อย่างเป็นระบบ

---

## ✨ Features

**สำหรับนักศึกษา**
- เข้าสู่ระบบด้วย Email และ Password ผ่าน Amazon Cognito
- เข้าร่วมคลาสด้วย Course Code
- ส่งคำถามหรือข้อสงสัยในคลาสโดยไม่ต้องถามต่อหน้าชั้นเรียน
- ติดตามสถานะคำถาม (รอคำตอบ / ตอบแล้ว)
- รับอีเมลแจ้งเตือนเมื่ออาจารย์ตอบคำถาม

**สำหรับอาจารย์**
- สร้างคลาสและกำหนด Course Code สำหรับนักศึกษา
- ดูรายการคำถามของนักศึกษาในคลาส
- ตอบคำถามและเปลี่ยนสถานะคำถาม
- วิเคราะห์การมีส่วนร่วมของนักศึกษา
- ดู Dashboard แบบ Real-time
- ดูรายงานสรุปหลังจบคลาส

---

## 🛠️ Tech Stack

<p>
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-FF9900?style=flat&logo=amazonaws&logoColor=white" />
</p>

| Layer | Technology | รายละเอียด |
|---|---|---|
| Frontend | Next.js + TypeScript | Web Application สำหรับนักศึกษาและอาจารย์ |
| Frontend Hosting | AWS Amplify | Deploy และ Host Frontend |
| Authentication | Amazon Cognito | ระบบ Login และจัดการ Token แยก role |
| Backend | Python FastAPI | REST API + WebSocket API |
| Backend Runtime | Amazon EC2 (t3.micro) | รัน Backend Server |
| Containerization | Docker | บรรจุ Backend เป็น Container |
| Database | Amazon RDS for MySQL | ฐานข้อมูลหลักของระบบ |

---

## 📁 Project Structure

```
CS232-Project-AWS-07/
├── frontend/                  # Next.js + TypeScript
│   ├── app/                   # Pages (App Router)
│   └── components/            # Reusable UI Components
├── backend/                   # Python FastAPI
│   ├── routes/                # API Endpoints
│   ├── models/                # Database Models
│   ├── schemas/               # Pydantic Schemas
│   ├── app.py                 # Entry Point
│   └── Dockerfile             # Docker Configuration
├── docs/                      # เอกสารโปรเจกต์
│   ├── database-schema.md
│   ├── api-documentation.md
│   ├── system-diagram.md
│   └── deployment-notes.md
└── README.md
```

---

## 🚀 Setup & Run Local Development

### Prerequisites
- Node.js >= 18
- Python >= 3.11
- Docker
- MySQL (local) หรือเชื่อมต่อ Amazon RDS

### 1. Clone Repository
```bash
git clone https://github.com/Gummy-168/CS232-Project-AWS-07.git
cd CS232-Project-AWS-07
```

### 2. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# แก้ไข NEXT_PUBLIC_API_URL และ Cognito config ใน .env.local
npm run dev
# รันที่ http://localhost:3000
```

### 3. Setup Backend (ด้วย Docker)
```bash
cd backend
cp .env.example .env
# แก้ไข DATABASE_URL, Cognito config, SES config ใน .env
docker build -t classq-backend .
docker run -p 5000:5000 --env-file .env classq-backend
# รันที่ http://localhost:5000
```

### 4. Environment Variables

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_REGION=ap-southeast-1
```

**`backend/.env`**
```env
PORT=5000
DATABASE_URL=mysql://user:password@localhost:3306/classq_dev
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_REGION=ap-southeast-1
SES_SENDER_EMAIL=noreply@yourdomain.com
AWS_REGION=ap-southeast-1
```

---

## 📚 Documents

- [Database Schema](./docs/database-schema.md)
- [API Documentation](./docs/api-documentation.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 🔗 Links
- **GitHub**: https://github.com/Gummy-168/CS232-Project-AWS-07
- **Video Demo**: [คลิกดู Video Demo](https://drive.google.com/drive/folders/1cboZRJni8yXYgUKF5q8HZe76bdqSe0n-?usp=sharing)

---

## 👥 Members

| ชื่อ | รหัสนักศึกษา | ตำแหน่ง |
|---|---|---|
| นายกนกพจน์ กาญจนประทุม | 6709620022 | ![Project Report](https://img.shields.io/badge/Project_Report-6366F1?style=flat) ![Team Support](https://img.shields.io/badge/Team_Support-8B5CF6?style=flat) |
| นางสาวโชติกา พัฒนาวิจิตร | 6709681073 | ![Frontend Developer](https://img.shields.io/badge/Frontend_Developer-EC4899?style=flat&logo=react&logoColor=white) |
| นางสาวสิริยากร พูนสินโภคทรัพย์ | 6709616939 | ![Frontend Developer](https://img.shields.io/badge/Frontend_Developer-EC4899?style=flat&logo=react&logoColor=white) |
| นายชาคริยา สุดเสน่ห์ | 6709620055 | ![Frontend Developer](https://img.shields.io/badge/Frontend_Developer-EC4899?style=flat&logo=react&logoColor=white) ![Team Support](https://img.shields.io/badge/Team_Support-8B5CF6?style=flat) |
| นายพนธกร เกษมสวัสดิ์ | 6709616665 | ![Backend Developer](https://img.shields.io/badge/Backend_Developer-10B981?style=flat&logo=fastapi&logoColor=white) ![Features](https://img.shields.io/badge/Features-059669?style=flat) |
| นายศุภณัฐ แก่นท้าว | 6709616905 | ![Backend Developer](https://img.shields.io/badge/Backend_Developer-10B981?style=flat&logo=fastapi&logoColor=white) ![Authentication](https://img.shields.io/badge/Authentication-F59E0B?style=flat&logo=auth0&logoColor=white) |
| นายรัฐภูมิ แสงคำมา | 6709616848 | ![Backend Developer](https://img.shields.io/badge/Backend_Developer-10B981?style=flat&logo=fastapi&logoColor=white) ![Database](https://img.shields.io/badge/Database-4479A1?style=flat&logo=mysql&logoColor=white) |

> ดูรายละเอียดบทบาทและงานที่รับผิดชอบได้ที่ [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 License

MIT License
