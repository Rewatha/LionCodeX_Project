<?php
// auth.php - Authentication API (Login, Register, Logout)
// File: backend/auth.php

define('INCLUDED', true);
require_once __DIR__ . '/config.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Initialize User class
$userManager = new User();

// Route requests
switch ($action) {
    case 'login':
        handleLogin();
        break;
        
    case 'register':
        handleRegister();
        break;
        
    case 'logout':
        handleLogout();
        break;
        
    case 'check-session':
        handleCheckSession();
        break;
        
    case 'get-current-user':
        handleGetCurrentUser();
        break;
        
    default:
        Response::error('Invalid action', 400);
}

// ============================================
// LOGIN HANDLER
// ============================================
function handleLogin() {
    global $userManager;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // If JSON decode fails, try form data
    if ($data === null) {
        $data = $_POST;
    }
    
    // Validate required fields
    if (empty($data['email']) || empty($data['password'])) {
        Response::error('Email and password are required');
    }
    
    try {
        // Attempt login
        $user = $userManager->login($data['email'], $data['password']);
        
        // Return success with user data
        Response::success('Login successful', [
            'user' => $user,
            'redirect' => getRedirectUrl($user['userType'])
        ]);
        
    } catch (Exception $e) {
        error_log("Login Error: " . $e->getMessage());
        Response::error('Login failed. Please check your credentials.');
    }
}

// ============================================
// REGISTER HANDLER
// ============================================
function handleRegister() {
    global $userManager;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // If JSON decode fails, try form data
    if ($data === null) {
        $data = $_POST;
    }
    
    try {
        // Register user
        $user = $userManager->register($data);
        
        // Auto-login after registration
        $loginUser = $userManager->login($data['email'], $data['password']);
        
        // Return success
        Response::success('Registration successful', [
            'user' => $loginUser,
            'message' => 'Your account has been created successfully!'
        ], 201);
        
    } catch (Exception $e) {
        error_log("Registration Error: " . $e->getMessage());
        Response::error('Registration failed. Please try again.');
    }
}

// ============================================
// LOGOUT HANDLER
// ============================================
function handleLogout() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    // Logout user
    User::logout();
    
    Response::success('Logged out successfully');
}

// ============================================
// CHECK SESSION HANDLER
// ============================================
function handleCheckSession() {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error('Method not allowed', 405);
    }
    
    if (User::isLoggedIn()) {
        $user = User::getCurrentUser();
        Response::success('Session active', ['user' => $user, 'logged_in' => true]);
    } else {
        Response::success('No active session', ['logged_in' => false]);
    }
}

// ============================================
// GET CURRENT USER HANDLER
// ============================================
function handleGetCurrentUser() {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error('Method not allowed', 405);
    }
    
    if (!User::isLoggedIn()) {
        Response::unauthorized('Not logged in');
    }
    
    $user = User::getCurrentUser();
    Response::success('User data retrieved', ['user' => $user]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getRedirectUrl($userType) {
    $redirectUrls = [
        'admin' => '../pages/admin-dashboard.html',
        'staff' => '../pages/staff-dashboard.html',
        'individual' => '../pages/user-dashboard.html',
        'business' => '../pages/user-dashboard.html',
        'contractor' => '../pages/user-dashboard.html'
    ];
    
    return $redirectUrls[$userType] ?? '../pages/user-dashboard.html';
}
?>