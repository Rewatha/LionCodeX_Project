<?php
// User.php - User Management Class
// File: backend/classes/User.php

class User {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // Register new user
    public function register($data) {
        // Validate required fields
        Response::validateRequired($data, ['firstName', 'lastName', 'email', 'password', 'userType']);
        
        // Sanitize inputs
        $firstName = Response::sanitize($data['firstName']);
        $lastName = Response::sanitize($data['lastName']);
        $email = Response::sanitize($data['email']);
        $phone = isset($data['phone']) ? Response::sanitize($data['phone']) : null;
        $address = isset($data['address']) ? Response::sanitize($data['address']) : null;
        $userType = Response::sanitize($data['userType']);
        $password = $data['password'];
        
        // Validate email
        if (!Response::validateEmail($email)) {
            Response::error('Invalid email address');
        }
        
        // Validate phone if provided
        if ($phone && !Response::validatePhone($phone)) {
            Response::error('Invalid phone number format');
        }
        
        // Check if email already exists
        if ($this->emailExists($email)) {
            Response::error('Email already registered');
        }
        
        // Validate password strength
        if (strlen($password) < 8) {
            Response::error('Password must be at least 8 characters long');
        }
        
        // Hash password
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => HASH_COST]);
        
        // Insert user
        try {
            $sql = "INSERT INTO users (first_name, last_name, email, phone, address, password_hash, user_type, status, email_verified) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0)";
            
            $userId = $this->db->insert($sql, [
                $firstName,
                $lastName,
                $email,
                $phone,
                $address,
                $passwordHash,
                $userType
            ]);
            
            return [
                'id' => $userId,
                'email' => $email,
                'firstName' => $firstName,
                'lastName' => $lastName,
                'userType' => $userType
            ];
            
        } catch (Exception $e) {
            error_log("Registration Error: " . $e->getMessage());
            Response::serverError('Registration failed');
        }
    }
    
    // Login user
    public function login($email, $password) {
        // Validate inputs
        if (empty($email) || empty($password)) {
            Response::error('Email and password are required');
        }
        
        // Sanitize email
        $email = Response::sanitize($email);
        
        // Validate email format
        if (!Response::validateEmail($email)) {
            Response::error('Invalid email address');
        }
        
        // Get user from database
        $sql = "SELECT * FROM users WHERE email = ? AND status = 'active'";
        $user = $this->db->fetchOne($sql, [$email]);
        
        if (!$user) {
            Response::error('Invalid email or password');
        }
        
        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            Response::error('Invalid email or password');
        }
        
        // Update last login
        $this->updateLastLogin($user['id']);
        
        // Create session
        $this->createSession($user);
        
        // Return user data (without password)
        return [
            'id' => $user['id'],
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'userType' => $user['user_type'],
            'emailVerified' => (bool)$user['email_verified']
        ];
    }
    
    // Check if email exists
    public function emailExists($email) {
        $sql = "SELECT id FROM users WHERE email = ?";
        $result = $this->db->fetchOne($sql, [$email]);
        return $result !== false;
    }
    
    // Get user by ID
    public function getUserById($userId) {
        $sql = "SELECT id, first_name, last_name, email, phone, address, user_type, status, email_verified, created_at 
                FROM users WHERE id = ?";
        return $this->db->fetchOne($sql, [$userId]);
    }
    
    // Update last login
    private function updateLastLogin($userId) {
        $sql = "UPDATE users SET last_login = NOW() WHERE id = ?";
        $this->db->execute($sql, [$userId]);
    }
    
    // Create session
    private function createSession($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_type'] = $user['user_type'];
        $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
    }
    
    // Check if user is logged in
    public static function isLoggedIn() {
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }
    
    // Get current user from session
    public static function getCurrentUser() {
        if (!self::isLoggedIn()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'],
            'userType' => $_SESSION['user_type'],
            'name' => $_SESSION['user_name']
        ];
    }
    
    // Check user type
    public static function hasRole($role) {
        if (!self::isLoggedIn()) {
            return false;
        }
        
        return $_SESSION['user_type'] === $role;
    }
    
    // Logout
    public static function logout() {
        session_unset();
        session_destroy();
        return true;
    }
}
?>