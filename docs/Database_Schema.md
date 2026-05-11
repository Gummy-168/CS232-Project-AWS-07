# 🗄️ Database Schema

ระบบนี้ใช้ **Amazon RDS for MySQL** เป็นฐานข้อมูลหลัก

เอกสารนี้อิงจาก `sql/init.sql`, `main.py`, และ ORM models ใน `models/`

---

## ภาพรวมความสัมพันธ์

```text
professors 1 ───< courses 1 ───< course_sections
                    │                │
                    │                ├──< enrollments >── 1 users (student)
                    │                │
                    │                ├──< interaction_boards ───< questions >── 1 users
                    │                │                                  │
                    │                │                                  └──< question_replies >── 1 users
                    │                │
                    │                └──< course_join_codes

users (student) 1 ───< enrollments
users (student/professor) 1 ───< questions
users (student/professor) 1 ───< question_replies
users 1 ───< notifications
```

---

## Tables

### `users`
เก็บข้อมูลผู้ใช้ระบบทั่วไป โดยใช้ทั้งนักศึกษาและบัญชีที่ sync จาก Cognito

| Column | Type | Description |
|---|---|---|
| `user_id` | VARCHAR(50) PK | รหัสผู้ใช้ |
| `email` | VARCHAR(255) UNIQUE | อีเมลสำหรับเข้าสู่ระบบ |
| `password_hash` | VARCHAR(255) | รหัสผ่านที่ hash แล้ว |
| `role` | ENUM('student', 'professor') | บทบาทของผู้ใช้ |
| `full_name` | VARCHAR(150) | ชื่อ-นามสกุล |
| `nickname` | VARCHAR(100) | ชื่อที่ใช้แสดงผล |
| `created_at` | DATETIME | เวลาที่สร้างบัญชี |

**หมายเหตุ**
- ใน `main.py` มี logic backfill `full_name` สำหรับข้อมูลเก่า
- professor ใช้ตาราง `professors` เป็นหลัก แต่ระบบยัง sync ข้อมูลบางส่วนกับ `users`

---

### `professors`
เก็บข้อมูลอาจารย์แยกจากตาราง `users`

| Column | Type | Description |
|---|---|---|
| `professor_id` | VARCHAR(50) PK | รหัสอาจารย์ |
| `email` | VARCHAR(255) UNIQUE | อีเมลสำหรับเข้าสู่ระบบ |
| `password_hash` | VARCHAR(255) | รหัสผ่านที่ hash แล้ว |
| `role` | ENUM('professor') | ค่าคงที่เป็น `professor` |
| `full_name` | VARCHAR(150) | ชื่อ-นามสกุล |
| `nickname` | VARCHAR(100) | ชื่อที่ใช้แสดงผล |
| `created_at` | DATETIME | เวลาที่สร้างบัญชี |

---

### `courses`
เก็บข้อมูลรายวิชาที่อาจารย์เป็นเจ้าของ

| Column | Type | Description |
|---|---|---|
| `course_code` | VARCHAR(50) PK | รหัสรายวิชา |
| `course_name` | VARCHAR(255) | ชื่อรายวิชา |
| `professor_id` | VARCHAR(50) FK → `professors.professor_id` | อาจารย์เจ้าของวิชา |
| `is_active` | BOOLEAN | สถานะการใช้งานของวิชา |
| `created_at` | DATETIME | เวลาที่สร้าง |

**Index / Constraint**
- index: `idx_courses_professor_id`
- foreign key: `fk_courses_professor`

---

### `enrollments`
เก็บความสัมพันธ์นักศึกษากับรายวิชาและ section ที่ลงทะเบียน

| Column | Type | Description |
|---|---|---|
| `enrollment_id` | INT AUTO_INCREMENT PK | รหัสลงทะเบียน |
| `student_id` | VARCHAR(50) FK → `users.user_id` | รหัสนักศึกษา |
| `course_code` | VARCHAR(50) FK → `courses.course_code` | รหัสรายวิชา |
| `section_id` | VARCHAR(50) FK → `course_sections.section_id` | รหัส section |
| `join_date` | DATETIME | เวลาที่เข้าร่วม |

**Index / Constraint**
- unique: `uq_enrollments_student_course` (`student_id`, `course_code`)
- index: `idx_enrollments_student_id`
- index: `idx_enrollments_course_code`
- index: `idx_enrollments_section_id`
- index: `idx_enrollments_student_course_section`
- foreign key: `fk_enrollments_student`
- foreign key: `fk_enrollments_course`
- foreign key: `fk_enrollments_section`

**หมายเหตุ**
- ผู้เรียนหนึ่งคนลงทะเบียนได้หนึ่งแถวต่อหนึ่งรายวิชา
- section เป็นตัวระบุ section ที่ผู้เรียนเข้าเรียนจริง

---

### `course_sections`
เก็บข้อมูล section ของแต่ละรายวิชา

| Column | Type | Description |
|---|---|---|
| `section_id` | VARCHAR(50) PK | รหัส section |
| `course_code` | VARCHAR(50) FK → `courses.course_code` | รายวิชาที่ section นี้สังกัด |
| `section_code` | VARCHAR(50) | รหัส section ที่ใช้แสดงผล |
| `meeting_days` | VARCHAR(100) | วันเรียน แยกด้วย comma |
| `start_time` | VARCHAR(5) | เวลาเริ่มเรียน |
| `end_time` | VARCHAR(5) | เวลาสิ้นสุด |
| `is_active` | BOOLEAN | สถานะการใช้งาน |
| `created_at` | DATETIME | เวลาที่สร้าง |

**Index / Constraint**
- unique: `uq_course_sections_course_section` (`course_code`, `section_code`)
- index: `idx_course_sections_course_code`
- foreign key: `fk_course_sections_course`

**หมายเหตุ**
- `meeting_days` เก็บเป็น string เช่น `Mon,Wed,Fri`

---

### `interaction_boards`
เก็บ board สำหรับ session การเรียนในแต่ละ section

| Column | Type | Description |
|---|---|---|
| `board_id` | VARCHAR(50) PK | รหัส board |
| `course_code` | VARCHAR(50) FK → `courses.course_code` | รายวิชา |
| `section_id` | VARCHAR(50) FK → `course_sections.section_id` | section ที่ board นี้ผูกอยู่ |
| `board_title` | VARCHAR(255) NULL | ชื่อ board |
| `opened_by` | VARCHAR(50) NULL | รหัสอาจารย์ที่เปิด board |
| `status` | ENUM('active', 'archived', 'closed') | สถานะ board |
| `created_at` | DATETIME | เวลาที่สร้าง |
| `closed_at` | DATETIME NULL | เวลาที่ปิด board |

**Index / Constraint**
- index: `idx_interaction_boards_course_code`
- index: `idx_interaction_boards_section_id`
- index: `idx_interaction_boards_course_section_status_created`
- foreign key: `fk_interaction_boards_course`
- foreign key: `fk_interaction_boards_section`

**หมายเหตุ**
- `main.py` จะใช้สถานะ `active` เป็น board ที่เปิดรับคำถาม
- ถ้าปิด board ระบบจะอัปเดต `status = closed` และใส่ `closed_at`

---

### `course_join_codes`
เก็บรหัสชั่วคราวสำหรับให้นักศึกษาเข้าร่วมรายวิชาหรือ section

| Column | Type | Description |
|---|---|---|
| `join_code_id` | VARCHAR(50) PK | รหัสรายการ join code |
| `code` | VARCHAR(20) UNIQUE | โค้ดที่ส่งให้ผู้เรียน |
| `course_code` | VARCHAR(50) FK → `courses.course_code` | รายวิชา |
| `section_id` | VARCHAR(50) FK → `course_sections.section_id` | section เป้าหมาย |
| `professor_id` | VARCHAR(50) FK → `professors.professor_id` | ผู้สร้าง join code |
| `expires_at` | DATETIME | เวลาหมดอายุ |
| `is_active` | BOOLEAN | ยังใช้งานได้หรือไม่ |
| `created_at` | DATETIME | เวลาที่สร้าง |

**Index / Constraint**
- index: `idx_course_join_codes_code`
- index: `idx_course_join_codes_code_is_active`
- index: `idx_course_join_codes_course_code`
- index: `idx_course_join_codes_section_id`
- index: `idx_course_join_codes_course_section_active`
- index: `idx_course_join_codes_professor_id`
- foreign key: `fk_course_join_codes_course`
- foreign key: `fk_course_join_codes_section`
- foreign key: `fk_course_join_codes_professor`

**หมายเหตุ**
- join code มีอายุชั่วคราว 15 นาทีตาม `CourseManager.JOIN_CODE_TTL_MINUTES`

---

### `questions`
เก็บคำถามที่นักศึกษาส่งเข้ามา

| Column | Type | Description |
|---|---|---|
| `question_id` | VARCHAR(50) PK | รหัสคำถาม |
| `board_id` | VARCHAR(50) NULL FK → `interaction_boards.board_id` | board ที่ผูกกับคำถาม |
| `course_code` | VARCHAR(50) FK → `courses.course_code` | รายวิชา |
| `section_id` | VARCHAR(50) FK → `course_sections.section_id` | section |
| `student_id` | VARCHAR(50) FK → `users.user_id` | ผู้ตั้งคำถาม |
| `title` | VARCHAR(255) | หัวข้อคำถาม |
| `content` | TEXT | เนื้อหาคำถาม |
| `reply_content` | TEXT NULL | คำตอบล่าสุดที่บันทึกไว้ |
| `status` | ENUM('pending', 'answered', 'deleted') | สถานะคำถาม |
| `is_anonymous` | BOOLEAN | ส่งแบบไม่ระบุตัวตนหรือไม่ |
| `participation_score` | INT | คะแนนการมีส่วนร่วม |
| `tags` | JSON NULL | tag ของคำถาม |
| `created_at` | DATETIME | เวลาที่สร้าง |
| `updated_at` | DATETIME | เวลาที่แก้ไขล่าสุด |

**Index / Constraint**
- index: `idx_questions_board_id`
- index: `idx_questions_course_code`
- index: `idx_questions_section_id`
- index: `idx_questions_student_id`
- index: `idx_questions_course_section_student_status_created`
- foreign key: `fk_questions_board`
- foreign key: `fk_questions_course`
- foreign key: `fk_questions_section`
- foreign key: `fk_questions_student`

**หมายเหตุ**
- `status = answered` เมื่ออาจารย์ตอบคำถาม
- `status = deleted` คือ soft delete
- `tags` เป็น JSON array เช่น `[
  "EC2",
  "AutoScaling"
]`

---

### `question_replies`
เก็บประวัติการตอบคำถาม

| Column | Type | Description |
|---|---|---|
| `reply_id` | VARCHAR(50) PK | รหัส reply |
| `question_id` | VARCHAR(50) FK → `questions.question_id` | คำถามที่ตอบ |
| `user_id` | VARCHAR(50) FK → `users.user_id` | คนที่ตอบ |
| `content` | TEXT | เนื้อหาคำตอบ |
| `created_at` | DATETIME | เวลาที่สร้าง |
| `updated_at` | DATETIME | เวลาที่แก้ไขล่าสุด |

**Index / Constraint**
- index: `idx_question_replies_question_id`
- index: `idx_question_replies_user_id`
- foreign key: `fk_question_replies_question`
- foreign key: `fk_question_replies_user`

---

### `notifications`
เก็บ notification ที่ส่งให้ผู้ใช้

| Column | Type | Description |
|---|---|---|
| `notification_id` | INT AUTO_INCREMENT PK | รหัส notification |
| `target_user_id` | VARCHAR(50) FK → `users.user_id` | ผู้รับ notification |
| `message` | TEXT | ข้อความแจ้งเตือน |
| `notif_type` | VARCHAR(50) | ประเภท notification |
| `is_read` | BOOLEAN | อ่านแล้วหรือยัง |
| `created_at` | DATETIME | เวลาที่สร้าง |

**Index / Constraint**
- index: `idx_notifications_target_user_id`
- foreign key: `fk_notifications_target_user`

---

## ER Summary

- `professors` **1:N** `courses`
- `courses` **1:N** `course_sections`
- `courses` **1:N** `enrollments`
- `course_sections` **1:N** `enrollments`
- `courses` **1:N** `interaction_boards`
- `course_sections` **1:N** `interaction_boards`
- `courses` **1:N** `course_join_codes`
- `course_sections` **1:N** `course_join_codes`
- `professors` **1:N** `course_join_codes`
- `interaction_boards` **1:N** `questions`
- `course_sections` **1:N** `questions`
- `users` **1:N** `questions`
- `questions` **1:N** `question_replies`
- `users` **1:N** `question_replies`
- `users` **1:N** `notifications`

---

## Implementation Notes

- `main.py` มี startup migration logic เพื่อเติมคอลัมน์หรือ index ที่ขาดจากฐานข้อมูลเก่า
- ระบบตอนนี้ใช้ `course_code` และ `section_id` เป็นแกนหลักของความสัมพันธ์มากกว่าระบบ `course_id/section_id` แบบเก่าในเอกสารเดิม
- ถ้าคุณกำลังอัปเดตเอกสารให้ทีม ใช้ schema ชุดนี้เป็นแหล่งอ้างอิงหลัก
