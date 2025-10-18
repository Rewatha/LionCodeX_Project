<?php
// simple_contact.php - Simple Contact Form Handler (No Login Required)
// File: backend/simple_contact.php

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Database connection
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'sealtech_db';

try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    // Set charset
    $conn->set_charset('utf8mb4');
    
} catch (Exception $e) {
    error_log('DB Connection Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed. Please try again later.'
    ]);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request method'
    ]);
    exit;
}

// Get and sanitize form data
$firstName = isset($_POST['firstName']) ? trim($_POST['firstName']) : '';
$lastName = isset($_POST['lastName']) ? trim($_POST['lastName']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$location = isset($_POST['location']) ? trim($_POST['location']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';
$serviceType = isset($_POST['serviceType']) ? trim($_POST['serviceType']) : 'General Inquiry';

// Sanitize inputs
$firstName = htmlspecialchars($firstName, ENT_QUOTES, 'UTF-8');
$lastName = htmlspecialchars($lastName, ENT_QUOTES, 'UTF-8');
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$phone = preg_replace('/[^0-9+]/', '', $phone);
$location = htmlspecialchars($location, ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
$serviceType = htmlspecialchars($serviceType, ENT_QUOTES, 'UTF-8');

// Validation
$errors = [];

if (empty($firstName)) {
    $errors[] = 'First name is required';
}

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (empty($phone)) {
    $errors[] = 'Phone number is required';
}

if (empty($message)) {
    $errors[] = 'Message is required';
}

// If validation errors, return them
if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'error' => implode(', ', $errors)
    ]);
    exit;
}

// Insert into database
$sql = "INSERT INTO inquiries (user_id, first_name, last_name, email, phone, location, message, service_type, status, created_at) 
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'new', NOW())";

try {
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Prepare statement failed: ' . $conn->error);
    }
    
    $stmt->bind_param("sssssss", $firstName, $lastName, $email, $phone, $location, $message, $serviceType);
    
    if ($stmt->execute()) {
        $inquiryId = $conn->insert_id;
        
        echo json_encode([
            'success' => true,
            'message' => 'Thank you for your inquiry! We will contact you soon.',
            'inquiry_id' => $inquiryId
        ]);
    } else {
        throw new Exception('Execute failed: ' . $stmt->error);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log('Insert Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save inquiry. Please try again.'
    ]);
}

$conn->close();
?>