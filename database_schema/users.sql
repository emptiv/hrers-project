CREATE DATABASE IF NOT EXISTS hrers_project;
USE hrers_project;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
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

-- Sample inserts once you have password hashes ready:
-- INSERT INTO users (employee_no, full_name, username, email, hashed_password, role) VALUES
-- ('EMP-0001', 'System Administrator', 'admin', 'admin@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'admin'),
-- ('EMP-0002', 'School Director', 'director', 'director@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'school_director'),
-- ('EMP-0003', 'HR Evaluator', 'hr_evaluator', 'hreval@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'hr_evaluator'),
-- ('EMP-0004', 'HR Head', 'hr_head', 'hrhead@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'hr_head'),
-- ('EMP-0005', 'Department Head', 'dept_head', 'depthead@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'department_head'),
-- ('EMP-0006', 'Employee', 'employee', 'employee@school.edu', '$2b$12$pJw.wah.2G42Sle7K0t4cOc3S.0dvYGyPxlkPuL41R9g9O6k8o7v.', 'employee');