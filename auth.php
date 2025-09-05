<?php
// SealTech Engineering - Complete Authentication Backend
// File: auth.php

session_start();
header('Content-Type: application/json');

// Include configuration
require_once 'config.php';

// Database configuration
$db_config = [
    'host' => DB_HOST,
    'username' => DB_USER,
    'password' => DB_PASS,
    'database' => DB_NAME
];

// Connect to database
try {
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8mb4",
        $db_config['username'],
        $db_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    logError("Database connection failed: " . $e->getMessage());
    exit;
}

// Utility functions
function sanitizeInput($data) {
    return trim(htmlspecialchars($data, ENT_QUOTES, 'UTF-8'));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validatePhone($phone) {
    $phone = preg_replace('/[\s\-]/', '', $phone);
    return preg_match('/^(\+94|0)?[7][0-9]{8}$/', $phone);
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function checkRateLimit($identifier, $maxAttempts = 5, $timeWindow = 3600) {
    $key = "rate_limit_" . md5($identifier);
    $currentTime = time();
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    
    // Remove old attempts
    $_SESSION[$key] = array_filter($_SESSION[$key], function($timestamp) use ($currentTime, $timeWindow) {
        return ($currentTime - $timestamp) < $timeWindow;
    });
    
    // Check if limit exceeded
    if (count($_SESSION[$key]) >= $maxAttempts) {
        return false;
    }
    
    // Record current attempt
    $_SESSION[$key][] = $currentTime;
    return true;
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Handle different actions
switch ($action) {
    case 'login':
        handleLogin($pdo);
        break;
    case 'register':
        handleRegister($pdo);
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check-session':
        handleCheckSession();
        break;
    case 'forgot-password':
        handleForgotPassword($pdo);
        break;
    case 'reset-password':
        handleResetPassword($pdo);
        break;
    case 'verify-email':
        handleVerifyEmail($pdo);
        break;
    case 'resend-verification':
        handleResendVerification($pdo);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

// Login handler
function handleLogin($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Rate limiting
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (!checkRateLimit("login_" . $clientIP, 10, 3600)) {
        echo json_encode(['error' => 'Too many login attempts. Please try again later.']);
        return;
    }
    
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $rememberMe = isset($_POST['rememberMe']);
    
    // Validation
    if (empty($email) || empty($password)) {
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    if (!validateEmail($email)) {
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    try {
        // Check user credentials
        $stmt = $pdo->prepare("
            SELECT id, email, password, first_name, last_name, user_type, verified, active 
            FROM users WHERE email = ? AND active = 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            // Log failed login attempt
            logLoginAttempt($pdo, $email, false, $clientIP);
            echo json_encode(['error' => 'Invalid email or password']);
            return;
        }
        
        if (!$user['verified']) {
            echo json_encode([
                'error' => 'Please verify your email before logging in',
                'action' => 'verify_email_required'
            ]);
            return;
        }
        
        // Successful login
        logLoginAttempt($pdo, $email, true, $clientIP);
        
        // Create session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_type'] = $user['user_type'];
        $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        
        // Set remember me cookie if requested
        if ($rememberMe) {
            $token = bin2hex(random_bytes(32));
            $expiry = time() + REMEMBER_TOKEN_LIFETIME;
            
            // Clean old tokens
            $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE user_id = ? OR expires_at < NOW()");
            $stmt->execute([$user['id']]);
            
            // Store new token in database
            $stmt = $pdo->prepare("
                INSERT INTO remember_tokens (user_id, token, expires_at) 
                VALUES (?, ?, FROM_UNIXTIME(?))
            ");
            $stmt->execute([$user['id'], hash('sha256', $token), $expiry]);
            
            // Set cookie
            setcookie('remember_token', $token, [
                'expires' => $expiry,
                'path' => '/',
                'domain' => '',
                'secure' => !DEBUG_MODE,
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
        }
        
        // Update last login
        $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['first_name'] . ' ' . $user['last_name'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name'],
                'userType' => $user['user_type']
            ],
            'redirect' => getDashboardURL($user['user_type'])
        ]);
        
    } catch (PDOException $e) {
        logError("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Login failed. Please try again.']);
    }
}

// Register handler
function handleRegister($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Rate limiting
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (!checkRateLimit("register_" . $clientIP, 3, 3600)) {
        echo json_encode(['error' => 'Too many registration attempts. Please try again later.']);
        return;
    }
    
    // Get form data
    $firstName = sanitizeInput($_POST['firstName'] ?? '');
    $lastName = sanitizeInput($_POST['lastName'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $phone = sanitizeInput($_POST['phone'] ?? '');
    $address = sanitizeInput($_POST['address'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirmPassword'] ?? '';
    $userType = sanitizeInput($_POST['userType'] ?? 'individual');
    $agreeTerms = isset($_POST['agreeTerms']);
    $newsletter = isset($_POST['newsletter']);
    
    // Validation
    $errors = [];
    
    if (empty($firstName) || strlen($firstName) < 2 || !preg_match('/^[a-zA-Z\s]+$/', $firstName)) {
        $errors[] = 'First name must be at least 2 characters and contain only letters';
    }
    
    if (empty($lastName) || strlen($lastName) < 2 || !preg_match('/^[a-zA-Z\s]+$/', $lastName)) {
        $errors[] = 'Last name must be at least 2 characters and contain only letters';
    }
    
    if (empty($email) || !validateEmail($email)) {
        $errors[] = 'Valid email is required';
    }
    
    if (empty($phone) || !validatePhone($phone)) {
        $errors[] = 'Valid Sri Lankan phone number is required (format: 077XXXXXXX)';
    }
    
    if (empty($address) || strlen($address) < 10) {
        $errors[] = 'Complete address is required (minimum 10 characters)';
    }
    
    if (empty($password) || strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters';
    }
    
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match';
    }
    
    if (!in_array($userType, ['individual', 'business', 'contractor'])) {
        $errors[] = 'Invalid account type';
    }
    
    if (!$agreeTerms) {
        $errors[] = 'You must agree to the Terms of Service and Privacy Policy';
    }
    
    if (!empty($errors)) {
        echo json_encode(['error' => implode('. ', $errors)]);
        return;
    }
    
    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['error' => 'Email address is already registered']);
            return;
        }
        
        // Check if phone already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
        $stmt->execute([$phone]);
        if ($stmt->fetch()) {
            echo json_encode(['error' => 'Phone number is already registered']);
            return;
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Generate verification token
        $verificationToken = bin2hex(random_bytes(32));
        
        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (
                first_name, last_name, email, phone, address, password, 
                user_type, newsletter_subscribed, verification_token, 
                created_at, active, verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1, 0)
        ");
        
        $stmt->execute([
            $firstName, $lastName, $email, $phone, $address, 
            $hashedPassword, $userType, $newsletter ? 1 : 0, $verificationToken
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Send verification email
        $emailSent = sendVerificationEmail($email, $firstName, $verificationToken);
        
        // Log registration
        logError("New user registered: {$email} (ID: {$userId})");
        
        if ($emailSent) {
            echo json_encode([
                'success' => true,
                'message' => 'Registration successful! Please check your email for verification instructions.',
                'action' => 'email_verification_sent'
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Registration successful! However, there was an issue sending the verification email. Please contact support.',
                'action' => 'email_verification_failed'
            ]);
        }
        
    } catch (PDOException $e) {
        logError("Registration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed. Please try again.']);
    }
}

// Logout handler
function handleLogout() {
    $userId = $_SESSION['user_id'] ?? null;
    
    // Clear remember token if exists
    if (isset($_COOKIE['remember_token']) && $userId) {
        $token = $_COOKIE['remember_token'];
        try {
            $pdo = Database::getInstance()->getConnection();
            $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE user_id = ? AND token = ?");
            $stmt->execute([$userId, hash('sha256', $token)]);
        } catch (Exception $e) {
            logError("Error clearing remember token: " . $e->getMessage());
        }
        
        setcookie('remember_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => !DEBUG_MODE,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    }
    
    // Clear session
    session_destroy();
    
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

// Check session handler
function handleCheckSession() {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in']) {
        echo json_encode([
            'logged_in' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['user_email'],
                'name' => $_SESSION['user_name'],
                'userType' => $_SESSION['user_type']
            ]
        ]);
    } else {
        // Check remember me token
        if (isset($_COOKIE['remember_token'])) {
            $rememberLogin = checkRememberToken($_COOKIE['remember_token']);
            if ($rememberLogin) {
                echo json_encode([
                    'logged_in' => true,
                    'user' => $rememberLogin,
                    'remembered' => true
                ]);
                return;
            }
        }
        
        echo json_encode(['logged_in' => false]);
    }
}

// Forgot password handler
function handleForgotPassword($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Rate limiting
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (!checkRateLimit("forgot_password_" . $clientIP, 3, 3600)) {
        echo json_encode(['error' => 'Too many password reset attempts. Please try again later.']);
        return;
    }
    
    $email = sanitizeInput($_POST['email'] ?? '');
    
    if (empty($email) || !validateEmail($email)) {
        echo json_encode(['error' => 'Valid email is required']);
        return;
    }
    
    try {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT id, first_name FROM users WHERE email = ? AND active = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Generate reset token
            $resetToken = bin2hex(random_bytes(32));
            $expiry = date('Y-m-d H:i:s', time() + PASSWORD_RESET_EXPIRY);
            
            // Store reset token
            $stmt = $pdo->prepare("
                INSERT INTO password_resets (user_id, token, expires_at) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE token = ?, expires_at = ?
            ");
            $stmt->execute([$user['id'], $resetToken, $expiry, $resetToken, $expiry]);
            
            // Send reset email
            sendPasswordResetEmail($email, $user['first_name'], $resetToken);
            
            logError("Password reset requested for: {$email}");
        }
        
        // Always return success (security measure)
        echo json_encode([
            'success' => true,
            'message' => 'If an account with that email exists, password reset instructions have been sent.'
        ]);
        
    } catch (PDOException $e) {
        logError("Password reset error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Password reset failed. Please try again.']);
    }
}

// Reset password handler
function handleResetPassword($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $token = sanitizeInput($_POST['token'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirmPassword'] ?? '';
    
    // Validation
    if (empty($token)) {
        echo json_encode(['error' => 'Invalid reset token']);
        return;
    }
    
    if (empty($password) || strlen($password) < 8) {
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        return;
    }
    
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        echo json_encode(['error' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number']);
        return;
    }
    
    if ($password !== $confirmPassword) {
        echo json_encode(['error' => 'Passwords do not match']);
        return;
    }
    
    try {
        // Verify token
        $stmt = $pdo->prepare("
            SELECT pr.user_id 
            FROM password_resets pr 
            WHERE pr.token = ? AND pr.expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $resetData = $stmt->fetch();
        
        if (!$resetData) {
            echo json_encode(['error' => 'Invalid or expired reset token']);
            return;
        }
        
        // Update password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $resetData['user_id']]);
        
        // Delete reset token
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE user_id = ?");
        $stmt->execute([$resetData['user_id']]);
        
        // Log password reset
        logError("Password reset completed for user ID: {$resetData['user_id']}");
        
        echo json_encode([
            'success' => true,
            'message' => 'Password reset successful. You can now login with your new password.'
        ]);
        
    } catch (PDOException $e) {
        logError("Password reset completion error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Password reset failed. Please try again.']);
    }
}

// Email verification handler
function handleVerifyEmail($pdo) {
    $token = sanitizeInput($_GET['token'] ?? '');
    
    if (empty($token)) {
        echo json_encode(['error' => 'Invalid verification token']);
        return;
    }
    
    try {
        // Find user with verification token
        $stmt = $pdo->prepare("
            SELECT id, email, first_name 
            FROM users 
            WHERE verification_token = ? AND verified = 0 AND active = 1
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            echo json_encode(['error' => 'Invalid or expired verification token']);
            return;
        }
        
        // Update user as verified
        $stmt = $pdo->prepare("
            UPDATE users 
            SET verified = 1, verification_token = NULL, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        
        // Log verification
        logError("Email verified for user: {$user['email']} (ID: {$user['id']})");
        
        echo json_encode([
            'success' => true,
            'message' => 'Email verified successfully! You can now login to your account.',
            'action' => 'redirect_to_login'
        ]);
        
    } catch (PDOException $e) {
        logError("Email verification error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Email verification failed. Please try again.']);
    }
}

// Resend verification email handler
function handleResendVerification($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $email = sanitizeInput($_POST['email'] ?? '');
    
    if (empty($email) || !validateEmail($email)) {
        echo json_encode(['error' => 'Valid email is required']);
        return;
    }
    
    try {
        // Find unverified user
        $stmt = $pdo->prepare("
            SELECT id, first_name, verification_token 
            FROM users 
            WHERE email = ? AND verified = 0 AND active = 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Generate new verification token if needed
            if (empty($user['verification_token'])) {
                $verificationToken = bin2hex(random_bytes(32));
                $stmt = $pdo->prepare("UPDATE users SET verification_token = ? WHERE id = ?");
                $stmt->execute([$verificationToken, $user['id']]);
            } else {
                $verificationToken = $user['verification_token'];
            }
            
            // Send verification email
            sendVerificationEmail($email, $user['first_name'], $verificationToken);
        }
        
        // Always return success (security measure)
        echo json_encode([
            'success' => true,
            'message' => 'If an unverified account with that email exists, a new verification email has been sent.'
        ]);
        
    } catch (PDOException $e) {
        logError("Resend verification error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to resend verification email. Please try again.']);
    }
}

// Helper functions
function checkRememberToken($token) {
    try {
        $pdo = Database::getInstance()->getConnection();
        $hashedToken = hash('sha256', $token);
        
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, u.first_name, u.last_name, u.user_type
            FROM remember_tokens rt
            JOIN users u ON rt.user_id = u.id
            WHERE rt.token = ? AND rt.expires_at > NOW() AND u.active = 1
        ");
        $stmt->execute([$hashedToken]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Recreate session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_type'] = $user['user_type'];
            $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
            $_SESSION['logged_in'] = true;
            $_SESSION['login_time'] = time();
            
            // Update last login
            $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            return [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['first_name'] . ' ' . $user['last_name'],
                'userType' => $user['user_type']
            ];
        }
    } catch (Exception $e) {
        logError("Remember token check error: " . $e->getMessage());
    }
    
    return false;
}

function logLoginAttempt($pdo, $email, $success, $ipAddress) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO login_attempts (email, ip_address, success, attempted_at) 
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$email, $ipAddress, $success ? 1 : 0]);
    } catch (PDOException $e) {
        logError("Failed to log login attempt: " . $e->getMessage());
    }
}

function getDashboardURL($userType) {
    switch ($userType) {
        case 'admin':
            return 'pages/admin-dashboard.html';
        case 'staff':
            return 'pages/staff-dashboard.html';
        default:
            return 'pages/user-dashboard.html';
    }
}

function sendVerificationEmail($email, $name, $token) {
    $subject = 'Verify Your SealTech Engineering Account';
    $verifyUrl = SITE_URL . "/verify.php?token=" . $token;
    
    $body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>Welcome to SealTech Engineering</h2>
        </div>
        <div class='content'>
            <p>Dear {$name},</p>
            <p>Thank you for registering with SealTech Engineering. Please verify your email address by clicking the button below:</p>
            <p><a href='{$verifyUrl}' class='button'>Verify Email Address</a></p>
            <p>Or copy and paste this link into your browser:<br><a href='{$verifyUrl}'>{$verifyUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>SealTech Engineering Team</p>
        </div>
        <div class='footer'>
            <p>SealTech Engineering | " . COMPANY_ADDRESS . " | " . COMPANY_PHONE . "</p>
        </div>
    </body>
    </html>";
    
    return sendEmail($email, $subject, $body);
}

function sendPasswordResetEmail($email, $name, $token) {
    $subject = 'Reset Your SealTech Engineering Password';
    $resetUrl = SITE_URL . "/reset-password.php?token=" . $token;
    
    $body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>Password Reset Request</h2>
        </div>
        <div class='content'>
            <p>Dear {$name},</p>
            <p>You have requested to reset your password for your SealTech Engineering account. Click the button below to set a new password:</p>
            <p><a href='{$resetUrl}' class='button'>Reset Password</a></p>
            <p>Or copy and paste this link into your browser:<br><a href='{$resetUrl}'>{$resetUrl}</a></p>
            <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
            <p>For security reasons, this password reset link can only be used once.</p>
            <p>Best regards,<br>SealTech Engineering Team</p>
        </div>
        <div class='footer'>
            <p>SealTech Engineering | " . COMPANY_ADDRESS . " | " . COMPANY_PHONE . "</p>
        </div>
    </body>
    </html>";
    
    return sendEmail($email, $subject, $body);
}
?>