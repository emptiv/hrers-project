USE hrers_project;

CREATE TABLE IF NOT EXISTS training_sessions (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    training_type VARCHAR(50) NOT NULL,
    training_date DATE NOT NULL,
    description TEXT NULL,
    provider VARCHAR(200) NULL,
    location VARCHAR(255) NULL,
    contact VARCHAR(255) NULL,
    total_slots INT NOT NULL DEFAULT 0,
    filled_slots INT NOT NULL DEFAULT 0,
    status ENUM('Open', 'Full', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Open',
    remarks TEXT NULL,
    created_by_user_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_training_sessions_title (title),
    KEY idx_training_sessions_status (status),
    CONSTRAINT fk_training_sessions_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO training_sessions (
    title, category, training_type, training_date, description, provider, location, contact, total_slots, filled_slots, status, remarks
) VALUES
('Outcomes-Based Education Workshop', 'Teaching', 'Onsite', '2026-03-12', 'College of Computer Studies', 'CCS - 201', 'Main building 2nd floor', 'ccs.admin@email.com', 30, 25, 'Open', 'Workshop on OBE implementation for faculty.'),
('Advanced Research Methods Seminar', 'Research', 'Online', '2026-04-05', 'Graduate School Office', 'GSO - Research Division', 'https://meet.uphsd.edu/research-seminar', 'gso.research@email.com', 40, 18, 'Open', 'Publication skills and grant writing basics.'),
('Leadership & Management Training', 'Leadership', 'Onsite', '2026-04-20', 'Human Resources Department', 'HR - Training Division', 'Admin Building Conference Room', 'hr.training@email.com', 25, 10, 'Open', 'Leadership development for supervisors and coordinators.'),
('Digital Literacy & Technology Integration', 'Technology', 'Hybrid', '2026-05-08', 'Information Technology Office', 'ITO - Digital Learning', 'Computer Lab 3 / Online Stream', 'ito.training@email.com', 50, 30, 'Open', 'Digital tools and classroom technology integration.'),
('Faculty Development Program', 'Development', 'Onsite', '2026-02-28', 'Annual faculty development seminar concluded.', 'External Agency', 'Auditorium', 'facdev@email.com', 20, 20, 'Completed', 'Annual faculty development seminar concluded.'),
('Safety & Emergency Response Training', 'Safety', 'Onsite', '2026-03-05', 'Cancelled due to venue unavailability.', 'Safety Officer', 'Gymnasium', 'safety@email.com', 25, 15, 'Cancelled', 'Cancelled due to venue unavailability.')
ON DUPLICATE KEY UPDATE
    category = VALUES(category),
    training_type = VALUES(training_type),
    training_date = VALUES(training_date),
    description = VALUES(description),
    provider = VALUES(provider),
    location = VALUES(location),
    contact = VALUES(contact),
    total_slots = VALUES(total_slots),
    filled_slots = VALUES(filled_slots),
    status = VALUES(status),
    remarks = VALUES(remarks);
