USE cs232db;

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'professor') NOT NULL,
    nickname VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
);

CREATE TABLE IF NOT EXISTS courses (
    course_code VARCHAR(50) PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    professor_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_courses_professor_id (professor_id),
    CONSTRAINT fk_courses_professor
        FOREIGN KEY (professor_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enrollments_student_course (student_id, course_code),
    INDEX idx_enrollments_student_id (student_id),
    INDEX idx_enrollments_course_code (course_code),
    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course
        FOREIGN KEY (course_code) REFERENCES courses(course_code)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interaction_boards (
    board_id VARCHAR(50) PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL,
    status ENUM('active', 'archived', 'closed') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_interaction_boards_course_code (course_code),
    CONSTRAINT fk_interaction_boards_course
        FOREIGN KEY (course_code) REFERENCES courses(course_code)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
    question_id VARCHAR(50) PRIMARY KEY,
    board_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    reply_content TEXT NULL,
    status ENUM('pending', 'answered', 'deleted') DEFAULT 'pending',
    is_anonymous BOOLEAN DEFAULT FALSE,
    participation_score INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_questions_board_id (board_id),
    INDEX idx_questions_student_id (student_id),
    CONSTRAINT fk_questions_board
        FOREIGN KEY (board_id) REFERENCES interaction_boards(board_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_questions_student
        FOREIGN KEY (student_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_replies (
    reply_id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_replies_question_id (question_id),
    INDEX idx_question_replies_user_id (user_id),
    CONSTRAINT fk_question_replies_question
        FOREIGN KEY (question_id) REFERENCES questions(question_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_question_replies_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    target_user_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    notif_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_target_user_id (target_user_id),
    CONSTRAINT fk_notifications_target_user
        FOREIGN KEY (target_user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
