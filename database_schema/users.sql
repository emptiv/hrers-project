CREATE DATABASE IF NOT EXISTS hrers_project;
USE hrers_project;

CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    employee_no VARCHAR(50) NULL,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'school_director', 'hr_evaluator', 'hr_head', 'department_head', 'employee') NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    must_change_password TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_employee_no (employee_no),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Seed users (hashed_password values are sample bcrypt hashes)
INSERT INTO users (
    employee_no,
    full_name,
    username,
    email,
    hashed_password,
    role,
    is_active,
    must_change_password
) VALUES
('EMP-0001', 'System Administrator', 'admin', 'admin@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'admin', 1, 1),
('EMP-0002', 'School Director', 'director', 'director@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'school_director', 1, 1),
('EMP-0003', 'HR Evaluator', 'hr_evaluator', 'hreval@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'hr_evaluator', 1, 1),
('EMP-0004', 'HR Head', 'hr_head', 'hrhead@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'hr_head', 1, 1),
('EMP-0005', 'Department Head - Academics', 'dept_head_acad', 'depthead.acad@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'department_head', 1, 1),
('EMP-0006', 'Department Head - IT', 'dept_head_it', 'depthead.it@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'department_head', 1, 1),
('EMP-0007', 'Employee One', 'employee1', 'employee1@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'employee', 1, 1),
('EMP-0008', 'Employee Two', 'employee2', 'employee2@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'employee', 1, 1)
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    username = VALUES(username),
    email = VALUES(email),
    hashed_password = VALUES(hashed_password),
    role = VALUES(role),
    is_active = VALUES(is_active),
    must_change_password = VALUES(must_change_password);

-- Seed departments after users exist so head_user_id can resolve
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