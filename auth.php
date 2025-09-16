<?php
define('SEALTECH_APP', true);
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $pdo = Database::getInstance()->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    logError("Database connection failed: " . $e->getMessage());
    exit;
}

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
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

function handleLogin($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (!checkRateLimit("login_" . $clientIP, 10, 3600)) {
        echo json_encode(['error' => 'Too many login attempts. Please try again later.']);
        return;
    }
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    $email = sanitizeInput($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    if (!validateEmail($email)) {
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, email, password, first_name, last_name, user_type, verified, active 
            FROM users WHERE email = ? AND active = 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            echo json_encode(['error' => 'Invalid email or password']);
            return;
        }
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_type'] = $user['user_type'];
        $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        
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
            ]
        ]);
        
    } catch (PDOException $e) {
        logError("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Login failed. Please try again.']);
    }
}

function handleRegister($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (!checkRateLimit("register_" . $clientIP, 3, 3600)) {
        echo json_encode(['error' => 'Too many registration attempts. Please try again later.']);
        return;
    }
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    $firstName = sanitizeInput($data['firstName'] ?? '');
    $lastName = sanitizeInput($data['lastName'] ?? '');
    $email = sanitizeInput($data['email'] ?? '');
    $phone = sanitizeInput($data['phone'] ?? '');
    $address = sanitizeInput($data['address'] ?? '');
    $password = $data['password'] ?? '';
    $confirmPassword = $data['confirmPassword'] ?? '';
    $userType = sanitizeInput($data['userType'] ?? 'individual');
    
    $errors = [];
    
    if (empty($firstName) || strlen($firstName) < 2) {
        $errors[] = 'First name must be at least 2 characters';
    }
    
    if (empty($lastName) || strlen($lastName) < 2) {
        $errors[] = 'Last name must be at least 2 characters';
    }
    
    if (empty($email) || !validateEmail($email)) {
        $errors[] = 'Valid email is required';
    }
    
    if (empty($phone)) {
        $errors[] = 'Phone number is required';
    }
    
    if (empty($address) || strlen($address) < 10) {
        $errors[] = 'Complete address is required (minimum 10 characters)';
    }
    
    if (empty($password) || strlen($password) < 6) {
        $errors[] = 'Password must be at least 6 characters';
    }
    
    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match';
    }
    
    if (!in_array($userType, ['individual', 'business', 'contractor'])) {
        $errors[] = 'Invalid account type';
    }
    
    if (!empty($errors)) {
        echo json_encode(['error' => implode('. ', $errors)]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['error' => 'Email address is already registered']);
            return;
        }
        
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("
            INSERT INTO users (
                first_name, last_name, email, phone, address, password, 
                user_type, newsletter_subscribed, verified, active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, 1, NOW())
        ");
        
        $stmt->execute([
            $firstName, $lastName, $email, $phone, $address, 
            $hashedPassword, $userType
        ]);
        
        $userId = $pdo->lastInsertId();
        
        logError("New user registered: {$email} (ID: {$userId})");
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful! You can now login.',
            'user_id' => $userId
        ]);
        
    } catch (PDOException $e) {
        logError("Registration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
    }
}

function handleLogout() {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function handleCheckSession() {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in']) {
        echo json_encode([
            'logged_in' => true,
            'user' => [
                'id' => $_SESSION['user_id'] ?? null,
                'email' => $_SESSION['user_email'] ?? null,
                'name' => $_SESSION['user_name'] ?? null,
                'userType' => $_SESSION['user_type'] ?? null
            ]
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
}
?>