<?php
// dashboard-api.php - User Dashboard API
// File: backend/dashboard-api.php

define('INCLUDED', true);
require_once __DIR__ . '/config.php';

// Check if user is logged in
if (!User::isLoggedIn()) {
    Response::unauthorized('Please login to access dashboard');
}

// Get current user
$currentUser = User::getCurrentUser();
$userId = $currentUser['id'];

// Get action
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Route requests
switch ($action) {
    case 'overview':
        handleOverview();
        break;
        
    case 'projects':
        handleProjects();
        break;
        
    case 'quotes':
        handleQuotes();
        break;
        
    case 'appointments':
        handleAppointments();
        break;
        
    case 'project-details':
        handleProjectDetails();
        break;
        
    case 'quote-details':
        handleQuoteDetails();
        break;
        
    case 'accept-quote':
        handleAcceptQuote();
        break;
        
    default:
        Response::error('Invalid action', 400);
}

// ============================================
// OVERVIEW STATS
// ============================================
function handleOverview() {
    global $db, $userId;
    
    try {
        // Count active projects
        $activeProjects = $db->fetchOne(
            "SELECT COUNT(*) as count FROM projects 
             WHERE user_id = ? AND status IN ('scheduled', 'in_progress')",
            [$userId]
        )['count'];
        
        // Count completed projects
        $completedProjects = $db->fetchOne(
            "SELECT COUNT(*) as count FROM projects 
             WHERE user_id = ? AND status = 'completed'",
            [$userId]
        )['count'];
        
        // Count upcoming appointments
        $upcomingAppointments = $db->fetchOne(
            "SELECT COUNT(*) as count FROM appointments 
             WHERE user_id = ? AND appointment_date >= NOW() AND status IN ('scheduled', 'confirmed')",
            [$userId]
        )['count'];
        
        // Count pending inquiries
        $pendingInquiries = $db->fetchOne(
            "SELECT COUNT(*) as count FROM inquiries 
             WHERE user_id = ? AND status IN ('new', 'contacted')",
            [$userId]
        )['count'];
        
        Response::success('Overview data retrieved', [
            'activeProjects' => (int)$activeProjects,
            'completedProjects' => (int)$completedProjects,
            'upcomingAppointments' => (int)$upcomingAppointments,
            'pendingInquiries' => (int)$pendingInquiries
        ]);
        
    } catch (Exception $e) {
        error_log("Overview Error: " . $e->getMessage());
        Response::serverError('Failed to load overview data');
    }
}

// ============================================
// PROJECTS LIST
// ============================================
function handleProjects() {
    global $db, $userId;
    
    try {
        $projects = $db->fetchAll(
            "SELECT 
                id,
                project_name,
                project_type,
                status,
                progress_percentage,
                start_date,
                estimated_completion,
                location,
                description
             FROM projects 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 10",
            [$userId]
        );
        
        Response::success('Projects retrieved', ['projects' => $projects]);
        
    } catch (Exception $e) {
        error_log("Projects Error: " . $e->getMessage());
        Response::serverError('Failed to load projects');
    }
}

// ============================================
// QUOTES LIST
// ============================================
function handleQuotes() {
    global $db, $userId;
    
    try {
        $quotes = $db->fetchAll(
            "SELECT 
                id,
                quote_number,
                service_type,
                total_amount,
                status,
                valid_until,
                description,
                created_at
             FROM quotes 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 10",
            [$userId]
        );
        
        Response::success('Quotes retrieved', ['quotes' => $quotes]);
        
    } catch (Exception $e) {
        error_log("Quotes Error: " . $e->getMessage());
        Response::serverError('Failed to load quotes');
    }
}

// ============================================
// APPOINTMENTS LIST
// ============================================
function handleAppointments() {
    global $db, $userId;
    
    try {
        $appointments = $db->fetchAll(
            "SELECT 
                id,
                appointment_type,
                description,
                appointment_date,
                duration_minutes,
                status,
                location
             FROM appointments 
             WHERE user_id = ? AND appointment_date >= NOW()
             ORDER BY appointment_date ASC 
             LIMIT 10",
            [$userId]
        );
        
        Response::success('Appointments retrieved', ['appointments' => $appointments]);
        
    } catch (Exception $e) {
        error_log("Appointments Error: " . $e->getMessage());
        Response::serverError('Failed to load appointments');
    }
}

// ============================================
// PROJECT DETAILS
// ============================================
function handleProjectDetails() {
    global $db, $userId;
    
    $projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;
    
    if (!$projectId) {
        Response::error('Project ID is required');
    }
    
    try {
        $project = $db->fetchOne(
            "SELECT * FROM projects WHERE id = ? AND user_id = ?",
            [$projectId, $userId]
        );
        
        if (!$project) {
            Response::notFound('Project not found');
        }
        
        Response::success('Project details retrieved', ['project' => $project]);
        
    } catch (Exception $e) {
        error_log("Project Details Error: " . $e->getMessage());
        Response::serverError('Failed to load project details');
    }
}

// ============================================
// QUOTE DETAILS
// ============================================
function handleQuoteDetails() {
    global $db, $userId;
    
    $quoteId = isset($_GET['quote_id']) ? (int)$_GET['quote_id'] : 0;
    
    if (!$quoteId) {
        Response::error('Quote ID is required');
    }
    
    try {
        $quote = $db->fetchOne(
            "SELECT * FROM quotes WHERE id = ? AND user_id = ?",
            [$quoteId, $userId]
        );
        
        if (!$quote) {
            Response::notFound('Quote not found');
        }
        
        // Update status to 'viewed' if it's 'sent'
        if ($quote['status'] === 'sent') {
            $db->execute(
                "UPDATE quotes SET status = 'viewed' WHERE id = ?",
                [$quoteId]
            );
            $quote['status'] = 'viewed';
        }
        
        Response::success('Quote details retrieved', ['quote' => $quote]);
        
    } catch (Exception $e) {
        error_log("Quote Details Error: " . $e->getMessage());
        Response::serverError('Failed to load quote details');
    }
}

// ============================================
// ACCEPT QUOTE
// ============================================
function handleAcceptQuote() {
    global $db, $userId;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    $quoteId = isset($_GET['quote_id']) ? (int)$_GET['quote_id'] : 0;
    
    if (!$quoteId) {
        Response::error('Quote ID is required');
    }
    
    try {
        // Verify quote belongs to user
        $quote = $db->fetchOne(
            "SELECT * FROM quotes WHERE id = ? AND user_id = ?",
            [$quoteId, $userId]
        );
        
        if (!$quote) {
            Response::notFound('Quote not found');
        }
        
        // Check if quote is still valid
        if (strtotime($quote['valid_until']) < time()) {
            Response::error('Quote has expired');
        }
        
        // Update quote status
        $db->execute(
            "UPDATE quotes SET status = 'accepted', updated_at = NOW() WHERE id = ?",
            [$quoteId]
        );
        
        // TODO: Create project from accepted quote (optional)
        
        Response::success('Quote accepted successfully', [
            'quote_id' => $quoteId,
            'message' => 'Thank you! We will contact you soon to schedule the work.'
        ]);
        
    } catch (Exception $e) {
        error_log("Accept Quote Error: " . $e->getMessage());
        Response::serverError('Failed to accept quote');
    }
}
?>