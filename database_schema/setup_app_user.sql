-- Create dedicated application user for HRERS
-- Execute this script with MySQL root privileges

-- First, ensure the database exists
CREATE DATABASE IF NOT EXISTS hrers_project;

-- Create the application user
CREATE USER IF NOT EXISTS 'hrers_user'@'localhost' IDENTIFIED BY 'HrersApp2026!';

-- Grant all privileges on the hrers_project database
GRANT ALL PRIVILEGES ON hrers_project.* TO 'hrers_user'@'localhost';

-- Flush privileges to ensure changes take effect immediately
FLUSH PRIVILEGES;

-- Verify the user was created
SELECT User, Host FROM mysql.user WHERE User='hrers_user';
