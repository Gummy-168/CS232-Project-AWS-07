USE cs232db;

INSERT IGNORE INTO users (user_id, email, password_hash, role, nickname)
VALUES
    ('prof001', 'prof001@example.com', 'hashed_password', 'professor', 'Prof CS232'),
    ('stu001', 'stu001@example.com', 'hashed_password', 'student', 'Student One'),
    ('stu002', 'stu002@example.com', 'hashed_password', 'student', 'Student Two');

INSERT IGNORE INTO courses (course_code, course_name, professor_id, is_active)
VALUES
    ('CS232', 'Smart Classroom Interaction System', 'prof001', TRUE);

INSERT IGNORE INTO enrollments (student_id, course_code)
VALUES
    ('stu001', 'CS232'),
    ('stu002', 'CS232');

INSERT IGNORE INTO interaction_boards (board_id, course_code, status)
VALUES
    ('board001', 'CS232', 'active');

INSERT IGNORE INTO questions (
    question_id,
    board_id,
    student_id,
    content,
    reply_content,
    status,
    is_anonymous,
    participation_score
)
VALUES
    (
        'q001',
        'board001',
        'stu001',
        'Will lecture slides be uploaded after class?',
        'Yes, I will upload them tonight.',
        'answered',
        FALSE,
        2
    ),
    (
        'q002',
        'board001',
        'stu002',
        'Can we submit the assignment in pairs?',
        NULL,
        'pending',
        TRUE,
        0
    );

INSERT IGNORE INTO notifications (target_user_id, message, notif_type, is_read)
VALUES
    (
        'stu001',
        'Your question q001 has been answered.',
        'question_reply',
        FALSE
    );
