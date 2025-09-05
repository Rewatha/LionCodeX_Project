-- SealTech Engineering Database Setup
-- File: database_setup.sql

-- Create database
CREATE DATABASE IF NOT EXISTS sealtech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sealtech_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('individual', 'business', 'contractor', 'staff', 'admin') DEFAULT 'individual',
    newsletter_subscribed BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(64) NULL,
    verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_verification_token (verification_token)
);

-- Contact inquiries table
CREATE TABLE contact_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    location VARCHAR(200) NULL,
    service_type VARCHAR(50) NULL,
    budget_range VARCHAR(50) NULL,
    timeline VARCHAR(50) NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'contacted', 'quoted', 'converted', 'closed') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(200) NOT NULL,
    estimated_cost DECIMAL(12,2) NULL,
    actual_cost DECIMAL(12,2) NULL,
    start_date DATE NULL,
    estimated_completion DATE NULL,
    actual_completion DATE NULL,
    status ENUM('planning', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
    progress_percentage INT DEFAULT 0,
    assigned_team_id INT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Quotes table
CREATE TABLE quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    inquiry_id INT NULL,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(200) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    valid_until DATE NOT NULL,
    status ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    terms_conditions TEXT,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_quote_number (quote_number),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (inquiry_id) REFERENCES contact_inquiries(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Quote items table
CREATE TABLE quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    item_description VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    project_id INT NULL,
    appointment_type ENUM('consultation', 'site_visit', 'work_start', 'inspection', 'maintenance') NOT NULL,
    appointment_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    location VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    assigned_staff_id INT NULL,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_id (customer_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Teams table
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_leader_id INT NULL,
    specialization VARCHAR(100) NULL,
    max_capacity INT DEFAULT 5,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_leader_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Team members table
CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_date DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_member (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project tasks table
CREATE TABLE project_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to_id INT NULL,
    estimated_hours DECIMAL(5,2) NULL,
    actual_hours DECIMAL(5,2) NULL,
    status ENUM('pending', 'in_progress', 'completed', 'on_hold') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    due_date DATE NULL,
    completed_date DATE NULL,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_project_id (project_id),
    INDEX idx_assigned_to (assigned_to_id),
    INDEX idx_status (status),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Equipment table
CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100) NULL,
    status ENUM('available', 'in_use', 'maintenance', 'retired') DEFAULT 'available',
    assigned_to_id INT NULL,
    purchase_date DATE NULL,
    warranty_expiry DATE NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to_id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Invoices table
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    project_id INT NULL,
    quote_id INT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    payment_terms VARCHAR(100) DEFAULT '30 days',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_invoice_number (invoice_number),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'check', 'card', 'online') NOT NULL,
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    transaction_reference VARCHAR(100) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_payment_date (payment_date),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Password reset tokens table
CREATE TABLE password_resets (
    user_id INT PRIMARY KEY,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Remember tokens table
CREATE TABLE remember_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login attempts table
CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address),
    INDEX idx_attempted_at (attempted_at)
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    read_status BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_read_status (read_status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings table
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user
INSERT INTO users (
    first_name, last_name, email, phone, address, password, user_type, verified, active
) VALUES (
    'Admin', 'User', 'admin@sealtechengineering.com', '0776336464', 
    'No.280/4 D, Daluwakotuwa, Kochchikade, Negombo',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'admin', TRUE, TRUE
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'SealTech Engineering', 'string', 'Company name'),
('company_email', 'info@sealtechengineering.com', 'string', 'Main company email'),
('company_phone', '077 633 6464', 'string', 'Main company phone'),
('company_address', 'No.280/4 D, Daluwakotuwa, Kochchikade, Negombo', 'string', 'Company address'),
('quote_validity_days', '30', 'number', 'Default quote validity in days'),
('tax_rate', '0', 'number', 'Default tax rate percentage'),
('currency', 'LKR', 'string', 'Default currency'),
('email_notifications', 'true', 'boolean', 'Enable email notifications'),
('sms_notifications', 'false', 'boolean', 'Enable SMS notifications');

-- Insert sample teams
INSERT INTO teams (team_name, specialization) VALUES
('Team Alpha', 'Residential Waterproofing'),
('Team Beta', 'Commercial Waterproofing'),
('Team Gamma', 'Emergency Repairs');

-- Create indexes for better performance
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_projects_dates ON projects(start_date, estimated_completion);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, status);

-- Create views for common queries
CREATE VIEW active_projects AS
SELECT 
    p.*,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    u.email as customer_email,
    u.phone as customer_phone
FROM projects p
JOIN users u ON p.customer_id = u.id
WHERE p.status IN ('scheduled', 'in_progress');

CREATE VIEW pending_quotes AS
SELECT 
    q.*,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    u.email as customer_email
FROM quotes q
JOIN users u ON q.customer_id = u.id
WHERE q.status IN ('draft', 'sent', 'viewed') AND q.valid_until >= CURDATE();

CREATE VIEW recent_inquiries AS
SELECT 
    ci.*,
    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as customer_name
FROM contact_inquiries ci
LEFT JOIN users u ON ci.email = u.email
WHERE ci.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY ci.created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON sealtech_db.* TO 'sealtech_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- FLUSH PRIVILEGES;
