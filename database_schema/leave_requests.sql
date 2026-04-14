USE hrers_project;

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT NOT NULL AUTO_INCREMENT,
    requester_user_id INT NOT NULL,
    requester_name VARCHAR(150) NOT NULL,
    requester_role VARCHAR(80) NOT NULL,
    leave_type VARCHAR(80) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    num_days INT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    reason TEXT NOT NULL,
    file_name VARCHAR(255) NULL,
    reviewed_by_user_id INT NULL,
    reviewed_by_name VARCHAR(150) NULL,
    review_remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_leave_requester (requester_user_id),
    KEY idx_leave_status (status),
    KEY idx_leave_dates (start_date, end_date),
    CONSTRAINT fk_leave_request_user
        FOREIGN KEY (requester_user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_leave_review_user
        FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;