USE hrers_project;

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NULL,
    username VARCHAR(80) NULL,
    email VARCHAR(255) NULL,
    actor_user_id INT NULL,
    actor_name VARCHAR(150) NULL,
    activity_type VARCHAR(64) NOT NULL,
    activity_label VARCHAR(120) NOT NULL,
    status_type VARCHAR(20) NOT NULL DEFAULT 'success',
    description TEXT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    login_time DATETIME NULL,
    logout_time DATETIME NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_logs_user_id (user_id),
    KEY idx_audit_logs_actor_user_id (actor_user_id),
    KEY idx_audit_logs_activity_type (activity_type),
    KEY idx_audit_logs_status_type (status_type),
    KEY idx_audit_logs_occurred_at (occurred_at),
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_audit_logs_actor_user
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
