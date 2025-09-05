<?php
// SealTech Engineering - Configuration File
// File: config.php

// Prevent direct access
if (!defined('SEALTECH_APP')) {
    define('SEALTECH_APP', true);
}

// Environment settings
define('ENVIRONMENT', 'development'); // 'development' or 'production'
define('DEBUG_MODE', ENVIRONMENT === 'development');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'sealtech_db');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// Email Configuration
define('MAIL_HOST', 'localhost');
define('MAIL_PORT', 587);
define('MAIL_USERNAME', 'noreply@sealtechengineering.com');
define('MAIL_PASSWORD', 'your_email_password');
define('MAIL_FROM_EMAIL', 'noreply@sealtechengineering.com');
define('MAIL_FROM_NAME', 'SealTech Engineering');
define('MAIL_TO_EMAIL', 'sealtechengineering@gmail.com');

// Site Configuration
define('SITE_URL', 'https://your-domain.com');
define('SITE_NAME', 'SealTech Engineering');
define('ADMIN_EMAIL', 'admin@sealtechengineering.com');
define('COMPANY_PHONE', '077 633 6464');
define('COMPANY_ADDRESS', 'No.280/4 D, Daluwakotuwa, Kochchikade, Negombo');

// Security Configuration
define('SESSION_LIFETIME', 3600); // 1 hour in seconds
define('REMEMBER_TOKEN_LIFETIME', 2592000); // 30 days in seconds
define('PASSWORD_RESET_EXPIRY', 3600); // 1 hour in seconds
define('EMAIL_VERIFICATION_EXPIRY', 86400); // 24 hours in seconds

// Rate Limiting
define('CONTACT_FORM_RATE_LIMIT', 5); // Max submissions per hour
define('LOGIN_RATE_LIMIT', 10); // Max login attempts per hour
define('PASSWORD_RESET_RATE_LIMIT', 3); // Max reset requests per hour

// File Upload Configuration
define('MAX_FILE_SIZE', 5242880); // 5MB in bytes
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);
define('UPLOAD_DIR', 'uploads/');

// Pagination
define('ITEMS_PER_PAGE', 25);
define('MAX_PAGINATION_LINKS', 10);

// Application Paths
define('ROOT_PATH', dirname(__FILE__));
define('INCLUDES_PATH', ROOT_PATH . '/includes');
define('TEMPLATES_PATH', ROOT_PATH . '/templates');
define('LOGS_PATH', ROOT_PATH . '/logs');

// Create necessary directories if they don't exist
$directories = [UPLOAD_DIR, LOGS_PATH];
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', LOGS_PATH . '/php_errors.log');
}

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', !DEBUG_MODE);
ini_set('session.use_strict_mode', 1);
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);

// Timezone
date_default_timezone_set('Asia/Colombo');

// Database Connection Class
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false
            ];
            
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                die("Database connection failed: " . $e->getMessage());
            } else {
                error_log("Database connection failed: " . $e->getMessage());
                die("Database connection failed. Please try again later.");
            }
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
}

// Utility Functions
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return trim(htmlspecialchars($data, ENT_QUOTES, 'UTF-8'));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validatePhone($phone) {
    // Sri Lankan phone number validation
    $phone = preg_replace('/[\s\-]/', '', $phone);
    return preg_match('/^(\+94|0)?[7][0-9]{8}$/', $phone);
}

function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function logError($message, $file = 'application.log') {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message" . PHP_EOL;
    file_put_contents(LOGS_PATH . '/' . $file, $logMessage, FILE_APPEND | LOCK_EX);
}

function sendEmail($to, $subject, $body, $isHTML = true) {
    $headers = [
        'MIME-Version: 1.0',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    if ($isHTML) {
        $headers[] = 'Content-type: text/html; charset=UTF-8';
    } else {
        $headers[] = 'Content-type: text/plain; charset=UTF-8';
    }
    
    $headers[] = 'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM_EMAIL . '>';
    
    return mail($to, $subject, $body, implode("\r\n", $headers));
}

function formatCurrency($amount, $currency = 'LKR') {
    return $currency . ' ' . number_format($amount, 2);
}

function formatDate($date, $format = 'Y-m-d') {
    if ($date instanceof DateTime) {
        return $date->format($format);
    }
    return date($format, strtotime($date));
}

function formatDateTime($datetime, $format = 'Y-m-d H:i:s') {
    if ($datetime instanceof DateTime) {
        return $datetime->format($format);
    }
    return date($format, strtotime($datetime));
}

function isValidCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && 
           hash_equals($_SESSION['csrf_token'], $token);
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = generateToken();
    }
    return $_SESSION['csrf_token'];
}

function checkRateLimit($identifier, $limit, $timeWindow = 3600) {
    $key = "rate_limit_" . md5($identifier);
    $current_time = time();
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    
    // Remove old entries
    $_SESSION[$key] = array_filter(
        $_SESSION[$key],
        function($timestamp) use ($current_time, $timeWindow) {
            return ($current_time - $timestamp) < $timeWindow;
        }
    );
    
    // Check if limit exceeded
    if (count($_SESSION[$key]) >= $limit) {
        return false;
    }
    
    // Add current attempt
    $_SESSION[$key][] = $current_time;
    return true;
}

function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: pages/auth.html');
        exit;
    }
}

function requireRole($requiredRole) {
    requireLogin();
    if (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== $requiredRole) {
        http_response_code(403);
        die('Access denied');
    }
}

function getUserType() {
    return $_SESSION['user_type'] ?? null;
}

function getUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getUserName() {
    return $_SESSION['user_name'] ?? 'User';
}

function redirectTo($url) {
    header("Location: $url");
    exit;
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function formatFileSize($bytes) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, 2) . ' ' . $units[$pow];
}

function isValidFileType($filename) {
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    return in_array($extension, ALLOWED_FILE_TYPES);
}

function createSlug($string) {
    $slug = strtolower($string);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

// Service Status Constants
define('SERVICE_STATUS_NEW', 'new');
define('SERVICE_STATUS_CONTACTED', 'contacted');
define('SERVICE_STATUS_QUOTED', 'quoted');
define('SERVICE_STATUS_CONVERTED', 'converted');
define('SERVICE_STATUS_CLOSED', 'closed');

// Project Status Constants
define('PROJECT_STATUS_PLANNING', 'planning');
define('PROJECT_STATUS_SCHEDULED', 'scheduled');
define('PROJECT_STATUS_IN_PROGRESS', 'in_progress');
define('PROJECT_STATUS_ON_HOLD', 'on_hold');
define('PROJECT_STATUS_COMPLETED', 'completed');
define('PROJECT_STATUS_CANCELLED', 'cancelled');

// Priority Constants
define('PRIORITY_LOW', 'low');
define('PRIORITY_MEDIUM', 'medium');
define('PRIORITY_HIGH', 'high');
define('PRIORITY_URGENT', 'urgent');

// User Types
define('USER_TYPE_INDIVIDUAL', 'individual');
define('USER_TYPE_BUSINESS', 'business');
define('USER_TYPE_CONTRACTOR', 'contractor');
define('USER_TYPE_STAFF', 'staff');
define('USER_TYPE_ADMIN', 'admin');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Generate CSRF token for the session
generateCSRFToken();
?>
