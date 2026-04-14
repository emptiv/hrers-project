USE hrers_project;

CREATE TABLE IF NOT EXISTS attendance_records (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    record_date DATE NOT NULL,
    time_in DATETIME NULL,
    time_out DATETIME NULL,
    worked_seconds INT NOT NULL DEFAULT 0,
    status ENUM('Present', 'Late', 'Leave', 'Holiday', 'Absent') NOT NULL DEFAULT 'Present',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_user_date (user_id, record_date),
    KEY idx_attendance_user (user_id),
    KEY idx_attendance_date (record_date),
    CONSTRAINT fk_attendance_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
