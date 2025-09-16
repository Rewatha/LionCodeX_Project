<?php
// SealTech Engineering - Configuration File
// File: config.php

// Prevent direct access
if (!defined('SEALTECH_APP')) {
    define('SEALTECH_APP', true);
}

// Environment settings
define('ENVIRONMENT', 'development');
define('DEBUG_MODE', ENVIRONMENT === 'development');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'sealtech_db');
define('DB_USER', 'root');
define('DB_PASS', '');
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
define('SITE_URL', 'http://localhost/LionCodeX_Project');
define('SITE_NAME', 'SealTech Engineering');
define('ADMIN_EMAIL', 'admin@sealtechengineering.com');
define('COMPANY_PHONE', '077 633 6464');
define('COMPANY_ADDRESS', 'No.280/4 D, Daluwakotuwa, Kochchikade, Negombo');

// Security Configuration
define('SESSION_LIFETIME', 3600);
define('REMEMBER_TOKEN_LIFETIME', 2592000);
define('PASSWORD_RESET_EXPIRY', 3600);
define('EMAIL_VERIFICATION_EXPIRY', 86400);

// Rate Limiting
define('CONTACT_FORM_RATE_LIMIT', 5);
define('LOGIN_RATE_LIMIT', 10);
define('PASSWORD_RESET_RATE_LIMIT', 3);

// File Upload Configuration
define('MAX_FILE_SIZE', 5242880);
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

// Session Configuration - BEFORE session_start()
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

function checkRateLimit($identifier, $limit, $timeWindow = 3600) {
    $key = "rate_limit_" . md5($identifier);
    $current_time = time();
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    
    $_SESSION[$key] = array_filter(
        $_SESSION[$key],
        function($timestamp) use ($current_time, $timeWindow) {
            return ($current_time - $timestamp) < $timeWindow;
        }
    );
    
    if (count($_SESSION[$key]) >= $limit) {
        return false;
    }
    
    $_SESSION[$key][] = $current_time;
    return true;
}

function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

function getUserType() {
    return $_SESSION['user_type'] ?? null;
}

function getUserId() {
    return $_SESSION['user_id'] ?? null;
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = generateToken();
    }
    return $_SESSION['csrf_token'];
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Generate CSRF token for the session
generateCSRFToken();
?>