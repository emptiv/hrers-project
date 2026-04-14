USE hrers_project;

CREATE TABLE IF NOT EXISTS training_registrations (
    id INT NOT NULL AUTO_INCREMENT,
    training_session_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Registered',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_training_registrations_user_session (training_session_id, user_id),
    KEY idx_training_registrations_user (user_id),
    CONSTRAINT fk_training_registrations_session
        FOREIGN KEY (training_session_id) REFERENCES training_sessions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_training_registrations_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;