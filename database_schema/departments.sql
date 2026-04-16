USE hrers_project;

CREATE TABLE IF NOT EXISTS departments (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NULL,
    location VARCHAR(200) NULL,
    budget DECIMAL(12,2) NULL,
    head_user_id INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_departments_name (name),
    KEY idx_departments_head_user_id (head_user_id),
    CONSTRAINT fk_departments_head_user
        FOREIGN KEY (head_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed departments (run users.sql first so referenced usernames exist)
INSERT INTO departments (name, email, location, budget, head_user_id, is_active) VALUES
('Academics', 'academics@school.edu', 'Main Building - 2F', 350000.00, (SELECT id FROM users WHERE username = 'dept_head_acad' LIMIT 1), 1),
('Information Technology', 'it@school.edu', 'Admin Annex - 1F', 500000.00, (SELECT id FROM users WHERE username = 'dept_head_it' LIMIT 1), 1),
('Human Resources', 'hr@school.edu', 'Admin Building - 3F', 200000.00, (SELECT id FROM users WHERE username = 'hr_head' LIMIT 1), 1),
('Finance', 'finance@school.edu', 'Finance Office - Ground Floor', 450000.00, NULL, 1)
ON DUPLICATE KEY UPDATE
    email = VALUES(email),
    location = VALUES(location),
    budget = VALUES(budget),
    head_user_id = VALUES(head_user_id),
    is_active = VALUES(is_active);