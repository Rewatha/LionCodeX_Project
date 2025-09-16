<?php
// SealTech Engineering - Dashboard API
// File: dashboard-api.php

session_start();
header('Content-Type: application/json');

// Include configuration
require_once 'config.php';

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Get current user ID
$currentUserId = $_SESSION['user_id'];
$userType = $_SESSION['user_type'] ?? 'individual';

// Get action from request
$action = $_GET['action'] ?? '';

// Connect to database
try {
    $pdo = Database::getInstance()->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    logError("Dashboard API database connection failed: " . $e->getMessage());
    exit;
}

// Route actions
switch ($action) {
    case 'overview':
        handleOverview($pdo, $currentUserId);
        break;
    case 'projects':
        handleProjects($pdo, $currentUserId);
        break;
    case 'quotes':
        handleQuotes($pdo, $currentUserId);
        break;
    case 'appointments':
        handleAppointments($pdo, $currentUserId);
        break;
    case 'project-details':
        handleProjectDetails($pdo, $currentUserId);
        break;
    case 'quote-details':
        handleQuoteDetails($pdo, $currentUserId);
        break;
    case 'accept-quote':
        handleAcceptQuote($pdo, $currentUserId);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

// Handle overview statistics
function handleOverview($pdo, $userId) {
    try {
        // Get active projects count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM projects 
            WHERE customer_id = ? AND status IN ('scheduled', 'in_progress')
        ");
        $stmt->execute([$userId]);
        $activeProjects = $stmt->fetchColumn();

        // Get completed projects count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM projects 
            WHERE customer_id = ? AND status = 'completed'
        ");
        $stmt->execute([$userId]);
        $completedProjects = $stmt->fetchColumn();

        // Get upcoming appointments count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE customer_id = ? AND appointment_date > NOW() AND status IN ('scheduled', 'confirmed')
        ");
        $stmt->execute([$userId]);
        $upcomingAppointments = $stmt->fetchColumn();

        // Get pending inquiries count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM contact_inquiries ci
            JOIN users u ON ci.email = u.email
            WHERE u.id = ? AND ci.status IN ('new', 'contacted')
        ");
        $stmt->execute([$userId]);
        $pendingInquiries = $stmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'activeProjects' => (int)$activeProjects,
            'completedProjects' => (int)$completedProjects,
            'upcomingAppointments' => (int)$upcomingAppointments,
            'pendingInquiries' => (int)$pendingInquiries
        ]);

    } catch (PDOException $e) {
        logError("Overview API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load overview data']);
    }
}

// Handle projects list
function handleProjects($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, project_name, project_type, location, status, 
                   progress_percentage, start_date, estimated_completion, 
                   estimated_cost, description
            FROM projects 
            WHERE customer_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        $stmt->execute([$userId]);
        $projects = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'projects' => $projects
        ]);

    } catch (PDOException $e) {
        logError("Projects API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load projects']);
    }
}

// Handle quotes list
function handleQuotes($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, quote_number, service_type, total_amount, status, 
                   valid_until, description, created_at
            FROM quotes 
            WHERE customer_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        $stmt->execute([$userId]);
        $quotes = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'quotes' => $quotes
        ]);

    } catch (PDOException $e) {
        logError("Quotes API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load quotes']);
    }
}

// Handle appointments list
function handleAppointments($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, appointment_type, appointment_date, duration_minutes, 
                   location, description, status
            FROM appointments 
            WHERE customer_id = ? AND appointment_date > NOW()
            ORDER BY appointment_date ASC 
            LIMIT 10
        ");
        $stmt->execute([$userId]);
        $appointments = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'appointments' => $appointments
        ]);

    } catch (PDOException $e) {
        logError("Appointments API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load appointments']);
    }
}

// Handle project details
function handleProjectDetails($pdo, $userId) {
    $projectId = $_GET['project_id'] ?? null;
    
    if (!$projectId) {
        http_response_code(400);
        echo json_encode(['error' => 'Project ID required']);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT p.*, u.first_name, u.last_name, u.email, u.phone
            FROM projects p
            JOIN users u ON p.customer_id = u.id
            WHERE p.id = ? AND p.customer_id = ?
        ");
        $stmt->execute([$projectId, $userId]);
        $project = $stmt->fetch();

        if (!$project) {
            http_response_code(404);
            echo json_encode(['error' => 'Project not found']);
            return;
        }

        // Get project tasks
        $stmt = $pdo->prepare("
            SELECT task_name, description, status, estimated_hours, 
                   actual_hours, due_date, completed_date
            FROM project_tasks 
            WHERE project_id = ? 
            ORDER BY sort_order ASC, created_at ASC
        ");
        $stmt->execute([$projectId]);
        $tasks = $stmt->fetchAll();

        $project['tasks'] = $tasks;

        echo json_encode([
            'success' => true,
            'project' => $project
        ]);

    } catch (PDOException $e) {
        logError("Project details API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load project details']);
    }
}

// Handle quote details
function handleQuoteDetails($pdo, $userId) {
    $quoteId = $_GET['quote_id'] ?? null;
    
    if (!$quoteId) {
        http_response_code(400);
        echo json_encode(['error' => 'Quote ID required']);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT * FROM quotes 
            WHERE id = ? AND customer_id = ?
        ");
        $stmt->execute([$quoteId, $userId]);
        $quote = $stmt->fetch();

        if (!$quote) {
            http_response_code(404);
            echo json_encode(['error' => 'Quote not found']);
            return;
        }

        // Get quote items
        $stmt = $pdo->prepare("
            SELECT item_description, quantity, unit_price, total_price
            FROM quote_items 
            WHERE quote_id = ? 
            ORDER BY sort_order ASC
        ");
        $stmt->execute([$quoteId]);
        $items = $stmt->fetchAll();

        $quote['items'] = $items;

        echo json_encode([
            'success' => true,
            'quote' => $quote
        ]);

    } catch (PDOException $e) {
        logError("Quote details API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load quote details']);
    }
}

// Handle quote acceptance
function handleAcceptQuote($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $quoteId = $_GET['quote_id'] ?? null;
    
    if (!$quoteId) {
        http_response_code(400);
        echo json_encode(['error' => 'Quote ID required']);
        return;
    }

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Verify quote belongs to user and is in valid status
        $stmt = $pdo->prepare("
            SELECT * FROM quotes 
            WHERE id = ? AND customer_id = ? AND status = 'sent' AND valid_until >= CURDATE()
        ");
        $stmt->execute([$quoteId, $userId]);
        $quote = $stmt->fetch();

        if (!$quote) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Quote not found or no longer valid']);
            return;
        }

        // Update quote status
        $stmt = $pdo->prepare("
            UPDATE quotes 
            SET status = 'accepted', updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$quoteId]);

        // Create project from quote
        $stmt = $pdo->prepare("
            INSERT INTO projects (
                customer_id, project_name, project_type, description, 
                location, estimated_cost, status, priority, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'planning', 'medium', NOW())
        ");
        
        $projectName = $quote['service_type'] . ' Project';
        $stmt->execute([
            $userId,
            $projectName,
            $quote['service_type'],
            $quote['description'],
            $quote['location'] ?? 'To be determined',
            $quote['total_amount'],
        ]);

        $projectId = $pdo->lastInsertId();

        // Create notification for user
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, created_at) 
            VALUES (?, ?, ?, 'success', NOW())
        ");
        $notificationMessage = "Your quote #{$quote['quote_number']} has been accepted and converted to project #{$projectId}.";
        $stmt->execute([$userId, 'Quote Accepted', $notificationMessage]);

        // Commit transaction
        $pdo->commit();

        // Log the acceptance
        logError("Quote {$quoteId} accepted by user {$userId}, created project {$projectId}");

        echo json_encode([
            'success' => true,
            'message' => 'Quote accepted successfully! Your project has been created.',
            'project_id' => $projectId
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        logError("Quote acceptance error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to accept quote']);
    }
}
?>