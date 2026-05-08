USE cs232db;

INSERT IGNORE INTO users (user_id, email, password_hash, role, full_name, nickname)
VALUES
    (
        'prof001',
        'prof001@example.com',
        '1ec76e799fcbdafce642c640793c7ca39a586bd17166ba0d4f9c98c65713b284',
        'professor',
        'Professor CS232',
        'Prof CS232'
    ),
    (
        'stu001',
        'stu001@example.com',
        'debb161e8b26f3cab862f7c9f1e87fb88f8282d566bb724e0eb1d583faf84f6a',
        'student',
        'Student One',
        'Student One'
    ),
    (
        'stu002',
        'stu002@example.com',
        'debb161e8b26f3cab862f7c9f1e87fb88f8282d566bb724e0eb1d583faf84f6a',
        'student',
        'Student Two',
        'Student Two'
    );

INSERT IGNORE INTO professors (
    professor_id,
    email,
    password_hash,
    role,
    full_name,
    nickname
)
VALUES
    (
        'prof001',
        'prof001@example.com',
        '1ec76e799fcbdafce642c640793c7ca39a586bd17166ba0d4f9c98c65713b284',
        'professor',
        'Professor CS232',
        'Prof CS232'
    );

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
    title,
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
        'Lecture Slides Upload',
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
        'Assignment Group Policy',
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
