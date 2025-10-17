<?php
// config.php - Database Configuration for SealTech Engineering
// File: backend/config.php

// Prevent direct access
if (!defined('INCLUDED')) {
    define('INCLUDED', true);
}

// Error reporting (turn off in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Colombo');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sealtech_db');
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('SITE_URL', 'http://localhost/LionCodeX_Project');
define('BACKEND_URL', SITE_URL . '/backend');

// Session Configuration
define('SESSION_LIFETIME', 3600 * 24); // 24 hours
define('SESSION_NAME', 'SEALTECH_SESSION');

// Security
define('HASH_COST', 10); // Password hashing cost
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_TIMEOUT', 900); // 15 minutes

// File Upload Configuration
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);

// Email Configuration (for later use)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'your-email@gmail.com');
define('SMTP_PASS', 'your-app-password');
define('FROM_EMAIL', 'noreply@sealtechengineering.com');
define('FROM_NAME', 'SealTech Engineering');

// Company Information
define('COMPANY_NAME', 'SealTech Engineering');
define('COMPANY_PHONE', '0776336464');
define('COMPANY_EMAIL', 'sealtechengineering@gmail.com');
define('COMPANY_ADDRESS', 'No.280/4 D, Daluwakotuwa, Kochchikade, Negombo');

// API Response Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}

// Include required classes
require_once __DIR__ . '/classes/Database.php';
require_once __DIR__ . '/classes/Response.php';
require_once __DIR__ . '/classes/User.php';

// Initialize Database Connection
$db = Database::getInstance();

?>