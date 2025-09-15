<?php
// SealTech Engineering - Contact Form Processing with Authentication
// File: submit_form.php

// Start session and set headers
session_start();
header('Content-Type: application/json');

// Include configuration and database
require_once 'config.php';

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Authentication check - require logged in user
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Authentication required. Please login to send a message.',
        'action' => 'redirect_to_login'
    ]);
    exit;
}

// Verify user exists in database
try {
    $pdo = Database::getInstance()->getConnection();
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, verified FROM users WHERE id = ? AND active = 1");
    $stmt->execute([$_SESSION['user_id']]);
    $currentUser = $stmt->fetch();
    
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid user session. Please login again.']);
        exit;
    }
    
    if (!$currentUser['verified']) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Please verify your email address before sending messages.',
            'action' => 'email_verification_required'
        ]);
        exit;
    }
} catch (PDOException $e) {
    logError("User verification error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error. Please try again.']);
    exit;
}

// CSRF Protection (optional enhancement)
if (isset($_POST['csrf_token']) && !isValidCSRFToken($_POST['csrf_token'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid security token. Please refresh and try again.']);
    exit;
}

// Rate limiting - check submissions from this user
if (!checkRateLimit("contact_form_user_" . $_SESSION['user_id'], CONTACT_FORM_RATE_LIMIT, 3600)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many submissions. Please wait before sending another message.']);
    exit;
}

// Main form processing
try {
    // Get and sanitize form data
    $firstName = sanitizeInput($_POST['firstName'] ?? '');
    $lastName = sanitizeInput($_POST['lastName'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $phone = sanitizeInput($_POST['phone'] ?? '');
    $location = sanitizeInput($_POST['location'] ?? '');
    $message = sanitizeInput($_POST['message'] ?? '');
    $serviceType = sanitizeInput($_POST['serviceType'] ?? '');
    $budget = sanitizeInput($_POST['budget'] ?? '');
    $timeline = sanitizeInput($_POST['timeline'] ?? '');
    
    // Additional user info from session
    $userId = $_SESSION['user_id'];
    $userName = $currentUser['first_name'] . ' ' . $currentUser['last_name'];
    $userEmail = $currentUser['email'];
    
    // Validation
    $errors = [];
    
    if (empty($firstName)) {
        $errors[] = 'First name is required';
    }
    
    if (empty($lastName)) {
        $errors[] = 'Last name is required';
    }
    
    if (empty($email)) {
        $errors[] = 'Email is required';
    } elseif (!validateEmail($email)) {
        $errors[] = 'Invalid email format';
    }
    
    if (empty($phone)) {
        $errors[] = 'Phone number is required';
    } elseif (!validatePhone($phone)) {
        $errors[] = 'Invalid phone number format';
    }
    
    if (empty($serviceType)) {
        $errors[] = 'Service type is required';
    }
    
    if (empty($message)) {
        $errors[] = 'Message is required';
    }
    
    if (!empty($errors)) {
        throw new Exception(implode(', ', $errors));
    }
    
    // Store inquiry in database
    $stmt = $pdo->prepare("
        INSERT INTO contact_inquiries (
            name, email, phone, location, service_type, budget_range, 
            timeline, message, status, priority, ip_address, user_agent, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 'medium', ?, ?, NOW())
    ");
    
    $fullName = $firstName . ' ' . $lastName;
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $stmt->execute([
        $fullName, $email, $phone, $location, $serviceType, 
        $budget, $timeline, $message, $ipAddress, $userAgent
    ]);
    
    $inquiryId = $pdo->lastInsertId();
    
    // Map service types for display
    $serviceTypes = [
        'roof' => 'Roof Waterproofing',
        'wall' => 'Wall Waterproofing',
        'foundation' => 'Foundation Waterproofing',
        'bathroom' => 'Bathroom Waterproofing',
        'basement' => 'Basement Waterproofing',
        'commercial' => 'Commercial Waterproofing',
        'emergency' => 'Emergency Repair',
        'consultation' => 'Consultation Only'
    ];
    $serviceText = isset($serviceTypes[$serviceType]) ? $serviceTypes[$serviceType] : $serviceType;
    
    // Map budget ranges for display
    $budgetRanges = [
        'under-100k' => 'Under LKR 100,000',
        '100k-500k' => 'LKR 100,000 - 500,000',
        '500k-1m' => 'LKR 500,000 - 1,000,000',
        '1m-plus' => 'Above LKR 1,000,000',
        'discuss' => 'Prefer to Discuss'
    ];
    $budgetText = isset($budgetRanges[$budget]) ? $budgetRanges[$budget] : $budget;
    
    // Map timelines for display
    $timelines = [
        'urgent' => 'Urgent (Within 1 week)',
        'soon' => 'Soon (2-4 weeks)',
        'flexible' => 'Flexible (1-3 months)',
        'planning' => 'Planning Stage'
    ];
    $timelineText = isset($timelines[$timeline]) ? $timelines[$timeline] : $timeline;
    
    // Prepare email content for admin
    $subject = 'New Contact Form Submission - ' . SITE_NAME . ' (User: ' . $userName . ')';
    
    // Create email body
    $emailBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #007bff; }
            .user-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>New Contact Form Submission</h2>
            <p>From Authenticated User</p>
        </div>
        <div class='content'>
            <div class='user-info'>
                <h3>User Information</h3>
                <div class='field'>
                    <span class='label'>User ID:</span> {$userId}
                </div>
                <div class='field'>
                    <span class='label'>Registered Name:</span> {$userName}
                </div>
                <div class='field'>
                    <span class='label'>Registered Email:</span> {$userEmail}
                </div>
                <div class='field'>
                    <span class='label'>Inquiry ID:</span> {$inquiryId}
                </div>
            </div>
            
            <h3>Inquiry Details</h3>
            <div class='field'>
                <span class='label'>Name:</span> {$fullName}
            </div>
            <div class='field'>
                <span class='label'>Email:</span> {$email}
            </div>
            <div class='field'>
                <span class='label'>Phone:</span> {$phone}
            </div>";
    
    if (!empty($location)) {
        $emailBody .= "<div class='field'><span class='label'>Location:</span> {$location}</div>";
    }
    
    $emailBody .= "<div class='field'><span class='label'>Service Type:</span> {$serviceText}</div>";
    
    if (!empty($budget)) {
        $emailBody .= "<div class='field'><span class='label'>Budget Range:</span> {$budgetText}</div>";
    }
    
    if (!empty($timeline)) {
        $emailBody .= "<div class='field'><span class='label'>Timeline:</span> {$timelineText}</div>";
    }
    
    $emailBody .= "
            <div class='field'>
                <span class='label'>Message:</span><br>
                " . nl2br($message) . "
            </div>
            <div class='field'>
                <span class='label'>Submitted:</span> " . date('Y-m-d H:i:s') . "
            </div>
            <div class='field'>
                <span class='label'>IP Address:</span> " . $ipAddress . "
            </div>
        </div>
        <div class='footer'>
            <p>This email was sent from the " . SITE_NAME . " website contact form by an authenticated user.</p>
            <p>You can respond directly to the customer at: {$email}</p>
        </div>
    </body>
    </html>";
    
    // Send email to admin
    $mailSent = sendEmail(MAIL_TO_EMAIL, $subject, $emailBody, true);
    
    if (!$mailSent) {
        logError("Failed to send admin notification email for inquiry ID: {$inquiryId}");
        // Don't throw error - inquiry is saved, just email failed
    }
    
    // Send auto-reply to customer
    $autoReplySubject = 'Thank you for contacting ' . SITE_NAME;
    $autoReplyBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
            .inquiry-ref { background: #e9ecef; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>Thank You for Your Inquiry</h2>
        </div>
        <div class='content'>
            <p>Dear {$firstName},</p>
            <p>Thank you for contacting SealTech Engineering through your account. We have received your inquiry and will respond within 24 hours with a detailed proposal.</p>
            
            <div class='inquiry-ref'>
                <strong>Your Inquiry Reference:</strong> #SE{$inquiryId}<br>
                <strong>Service Requested:</strong> {$serviceText}<br>
                <strong>Submitted:</strong> " . date('Y-m-d H:i:s') . "
            </div>
            
            <p><strong>Your inquiry summary:</strong></p>
            <p>" . nl2br($message) . "</p>
            
            <p>As a registered customer, you can track the status of this inquiry in your dashboard.</p>
            
            <p>For urgent matters, please call us directly at " . COMPANY_PHONE . ".</p>
            
            <p>Best regards,<br>SealTech Engineering Team</p>
        </div>
        <div class='footer'>
            <p>" . SITE_NAME . " | " . COMPANY_ADDRESS . " | " . COMPANY_PHONE . "</p>
            <p>This is an automated response. Please do not reply to this email.</p>
        </div>
    </body>
    </html>";
    
    $autoReplySent = sendEmail($email, $autoReplySubject, $autoReplyBody, true);
    
    if (!$autoReplySent) {
        logError("Failed to send auto-reply email for inquiry ID: {$inquiryId} to: {$email}");
    }
    
    // Create notification for user (optional)
    try {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, created_at) 
            VALUES (?, ?, ?, 'success', NOW())
        ");
        $notificationMessage = "Your inquiry about {$serviceText} has been submitted successfully. Reference: #SE{$inquiryId}";
        $stmt->execute([$userId, 'Inquiry Submitted', $notificationMessage]);
    } catch (PDOException $e) {
        logError("Failed to create notification for user {$userId}: " . $e->getMessage());
    }
    
    // Log the submission
    $logEntry = date('Y-m-d H:i:s') . " - Authenticated form submission - User: {$userName} ({$userId}) - Email: {$email} - Inquiry ID: {$inquiryId}\n";
    file_put_contents(LOGS_PATH . '/contact_submissions.log', $logEntry, FILE_APPEND | LOCK_EX);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your inquiry! We will contact you within 24 hours. Your reference number is #SE' . $inquiryId,
        'inquiry_id' => $inquiryId,
        'reference' => 'SE' . $inquiryId
    ]);
    
} catch (Exception $e) {
    logError("Contact form submission error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>