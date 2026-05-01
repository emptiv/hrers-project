USE hrers_project;

CREATE TABLE IF NOT EXISTS position_change_requests (
    id INT NOT NULL AUTO_INCREMENT,
    requester_user_id INT NOT NULL,
    employee_name VARCHAR(150) NOT NULL,
    employee_no VARCHAR(50) NULL,
    current_position VARCHAR(120) NULL,
    current_department VARCHAR(120) NULL,
    requested_position VARCHAR(120) NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    approval_stage VARCHAR(40) NOT NULL DEFAULT 'hr_evaluator',
    reviewed_by_user_id INT NULL,
    reviewed_by_name VARCHAR(150) NULL,
    review_remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pcr_requester (requester_user_id),
    KEY idx_pcr_status (status),
    CONSTRAINT fk_pcr_requester_user
        FOREIGN KEY (requester_user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_pcr_reviewer_user
        FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;