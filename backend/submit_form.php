<?php
// submit_form.php - Contact Form Handler
// File: backend/submit_form.php

define('INCLUDED', true);
require_once __DIR__ . '/config.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// FIX: Allow public users (Guest) to submit forms
// We check if they are logged in, but we don't STOP them if they aren't.
$userId = null;
if (User::isLoggedIn()) {
    $currentUser = User::getCurrentUser();
    $userId = $currentUser['id'];
}

// Get form data
$firstName = isset($_POST['firstName']) ? Response::sanitize($_POST['firstName']) : '';
$lastName = isset($_POST['lastName']) ? Response::sanitize($_POST['lastName']) : '';
$email = isset($_POST['email']) ? Response::sanitize($_POST['email']) : '';
$phone = isset($_POST['phone']) ? Response::sanitize($_POST['phone']) : '';
$serviceType = isset($_POST['serviceType']) ? Response::sanitize($_POST['serviceType']) : '';
$location = isset($_POST['location']) ? Response::sanitize($_POST['location']) : '';
$message = isset($_POST['message']) ? Response::sanitize($_POST['message']) : '';
$budget = isset($_POST['budget']) ? Response::sanitize($_POST['budget']) : null;
$timeline = isset($_POST['timeline']) ? Response::sanitize($_POST['timeline']) : null;

// Validate required fields
$errors = [];

if (empty($firstName)) {
    $errors['firstName'] = 'First name is required';
}

if (empty($email)) {
    $errors['email'] = 'Email is required';
} elseif (!Response::validateEmail($email)) {
    $errors['email'] = 'Invalid email address';
}

if (empty($phone)) {
    $errors['phone'] = 'Phone number is required';
}

if (empty($message)) {
    $errors['message'] = 'Message is required';
}

// If validation errors, return them
if (!empty($errors)) {
    Response::validationError($errors);
}

// Insert inquiry into database
try {
    $sql = "INSERT INTO inquiries 
            (user_id, first_name, last_name, email, phone, service_type, location, message, budget, timeline, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', NOW())";

    // Note: $userId will be NULL if the user is a guest, which is allowed by your database
    $inquiryId = $db->insert($sql, [
        $userId,
        $firstName,
        $lastName,
        $email,
        $phone,
        $serviceType,
        $location,
        $message,
        $budget,
        $timeline
    ]);

    Response::success('Your inquiry has been submitted successfully!', [
        'inquiry_id' => $inquiryId,
        'message' => 'Thank you for contacting SealTech Engineering. We will respond to your inquiry within 24 hours.'
    ], 201);

} catch (Exception $e) {
    error_log("Contact Form Error: " . $e->getMessage());
    Response::serverError('Failed to submit inquiry. Please try again.');
}
?>