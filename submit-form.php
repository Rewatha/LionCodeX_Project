<?php
// SealTech Engineering - Contact Form Processing
// File: submit_form.php

// Start session and set headers
session_start();
header('Content-Type: application/json');

// CSRF Protection
if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    // For now, we'll skip CSRF validation since forms don't have tokens yet
    // In production, you should implement CSRF tokens
}

// Configuration
$config = [
    'smtp_host' => 'localhost', // Change to your SMTP server
    'smtp_port' => 587,
    'smtp_username' => 'noreply@sealtechengineering.com',
    'smtp_password' => 'your_email_password',
    'from_email' => 'noreply@sealtechengineering.com',
    'to_email' => 'sealtechengineering@gmail.com',
    'company_name' => 'SealTech Engineering',
    'admin_email' => 'admin@sealtechengineering.com'
];

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Sanitize input function
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Validate email function
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Validate phone number (Sri Lankan format)
function validatePhone($phone) {
    // Remove spaces and dashes
    $phone = preg_replace('/[\s\-]/', '', $phone);
    // Check Sri Lankan phone number format
    return preg_match('/^(\+94|0)?[7][0-9]{8}$/', $phone);
}

// Rate limiting (simple implementation)
function checkRateLimit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $current_time = time();
    
    if (!isset($_SESSION['form_submissions'])) {
        $_SESSION['form_submissions'] = [];
    }
    
    // Remove submissions older than 1 hour
    $_SESSION['form_submissions'] = array_filter(
        $_SESSION['form_submissions'],
        function($timestamp) use ($current_time) {
            return ($current_time - $timestamp) < 3600;
        }
    );
    
    // Check if more than 5 submissions in last hour
    if (count($_SESSION['form_submissions']) >= 5) {
        return false;
    }
    
    $_SESSION['form_submissions'][] = $current_time;
    return true;
}

// Main form processing
try {
    // Check rate limiting
    if (!checkRateLimit()) {
        throw new Exception('Too many submissions. Please try again later.');
    }
    
    // Get and sanitize form data
    $name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
    $firstName = isset($_POST['firstName']) ? sanitizeInput($_POST['firstName']) : '';
    $lastName = isset($_POST['lastName']) ? sanitizeInput($_POST['lastName']) : '';
    $email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
    $phone = isset($_POST['phone']) ? sanitizeInput($_POST['phone']) : '';
    $location = isset($_POST['location']) ? sanitizeInput($_POST['location']) : '';
    $message = isset($_POST['message']) ? sanitizeInput($_POST['message']) : '';
    $serviceType = isset($_POST['serviceType']) ? sanitizeInput($_POST['serviceType']) : '';
    $budget = isset($_POST['budget']) ? sanitizeInput($_POST['budget']) : '';
    $timeline = isset($_POST['timeline']) ? sanitizeInput($_POST['timeline']) : '';
    
    // Determine if this is a simple contact form or detailed form
    $isDetailedForm = !empty($firstName) && !empty($lastName);
    
    if ($isDetailedForm) {
        $fullName = $firstName . ' ' . $lastName;
    } else {
        $fullName = $name;
    }
    
    // Validation
    $errors = [];
    
    if (empty($fullName)) {
        $errors[] = 'Name is required';
    }
    
    if (empty($email)) {
        $errors[] = 'Email is required';
    } elseif (!validateEmail($email)) {
        $errors[] = 'Invalid email format';
    }
    
    if (!empty($phone) && !validatePhone($phone)) {
        $errors[] = 'Invalid phone number format';
    }
    
    if (empty($message)) {
        $errors[] = 'Message is required';
    }
    
    if (!empty($errors)) {
        throw new Exception(implode(', ', $errors));
    }
    
    // Prepare email content
    $subject = 'New Contact Form Submission - ' . $config['company_name'];
    
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
            .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>New Contact Form Submission</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <span class='label'>Name:</span> {$fullName}
            </div>
            <div class='field'>
                <span class='label'>Email:</span> {$email}
            </div>";
    
    if (!empty($phone)) {
        $emailBody .= "<div class='field'><span class='label'>Phone:</span> {$phone}</div>";
    }
    
    if (!empty($location)) {
        $emailBody .= "<div class='field'><span class='label'>Location:</span> {$location}</div>";
    }
    
    if (!empty($serviceType)) {
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
        $emailBody .= "<div class='field'><span class='label'>Service Type:</span> {$serviceText}</div>";
    }
    
    if (!empty($budget)) {
        $budgetRanges = [
            'under-100k' => 'Under LKR 100,000',
            '100k-500k' => 'LKR 100,000 - 500,000',
            '500k-1m' => 'LKR 500,000 - 1,000,000',
            '1m-plus' => 'Above LKR 1,000,000',
            'discuss' => 'Prefer to Discuss'
        ];
        $budgetText = isset($budgetRanges[$budget]) ? $budgetRanges[$budget] : $budget;
        $emailBody .= "<div class='field'><span class='label'>Budget Range:</span> {$budgetText}</div>";
    }
    
    if (!empty($timeline)) {
        $timelines = [
            'urgent' => 'Urgent (Within 1 week)',
            'soon' => 'Soon (2-4 weeks)',
            'flexible' => 'Flexible (1-3 months)',
            'planning' => 'Planning Stage'
        ];
        $timelineText = isset($timelines[$timeline]) ? $timelines[$timeline] : $timeline;
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
                <span class='label'>IP Address:</span> " . $_SERVER['REMOTE_ADDR'] . "
            </div>
        </div>
        <div class='footer'>
            <p>This email was sent from the {$config['company_name']} website contact form.</p>
        </div>
    </body>
    </html>";
    
    // Send email using PHP mail() or SMTP
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $config['from_email'],
        'Reply-To: ' . $email,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    $mailSent = mail(
        $config['to_email'],
        $subject,
        $emailBody,
        implode("\r\n", $headers)
    );
    
    if (!$mailSent) {
        throw new Exception('Failed to send email. Please try again or contact us directly.');
    }
    
    // Send auto-reply to customer
    $autoReplySubject = 'Thank you for contacting ' . $config['company_name'];
    $autoReplyBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>Thank You for Your Inquiry</h2>
        </div>
        <div class='content'>
            <p>Dear {$fullName},</p>
            <p>Thank you for contacting SealTech Engineering. We have received your inquiry and will respond within 24 hours.</p>
            <p><strong>Your inquiry details:</strong></p>
            <p><strong>Service:</strong> " . (isset($serviceText) ? $serviceText : 'General Inquiry') . "</p>
            <p><strong>Message:</strong> " . nl2br($message) . "</p>
            <p>For urgent matters, please call us directly at 077 633 6464.</p>
            <p>Best regards,<br>SealTech Engineering Team</p>
        </div>
        <div class='footer'>
            <p>SealTech Engineering | No.280/4 D, Daluwakotuwa, Kochchikade, Negombo | 077 633 6464</p>
        </div>
    </body>
    </html>";
    
    $autoReplyHeaders = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $config['from_email'],
        'X-Mailer: PHP/' . phpversion()
    ];
    
    mail(
        $email,
        $autoReplySubject,
        $autoReplyBody,
        implode("\r\n", $autoReplyHeaders)
    );
    
    // Log the submission (optional)
    $logEntry = date('Y-m-d H:i:s') . " - Form submission from: {$fullName} ({$email})\n";
    file_put_contents('contact_logs.txt', $logEntry, FILE_APPEND | LOCK_EX);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your inquiry! We will contact you within 24 hours.'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
