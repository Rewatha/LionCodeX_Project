<?php
// SealTech Engineering - Admin Dashboard API
// File: admin-api.php

session_start();
header('Content-Type: application/json');

// Include configuration
require_once 'config.php';

// Check if user is logged in and is admin
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if ($_SESSION['user_type'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

// Get current admin user ID
$currentUserId = $_SESSION['user_id'];

// Get action from request
$action = $_GET['action'] ?? '';

// Connect to database
try {
    $pdo = Database::getInstance()->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    logError("Admin API database connection failed: " . $e->getMessage());
    exit;
}

// Route actions
switch ($action) {
    case 'overview':
        handleOverview($pdo);
        break;
    case 'inquiries':
        handleInquiries($pdo);
        break;
    case 'projects':
        handleProjects($pdo);
        break;
    case 'team-status':
        handleTeamStatus($pdo);
        break;
    case 'revenue':
        handleRevenue($pdo);
        break;
    case 'assign-inquiry':
        handleAssignInquiry($pdo, $currentUserId);
        break;
    case 'update-project':
        handleUpdateProject($pdo, $currentUserId);
        break;
    case 'user-management':
        handleUserManagement($pdo);
        break;
    case 'system-stats':
        handleSystemStats($pdo);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

// Handle admin overview statistics
function handleOverview($pdo) {
    try {
        // Get total customers
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM users 
            WHERE user_type IN ('individual', 'business', 'contractor') AND active = 1
        ");
        $stmt->execute();
        $totalCustomers = $stmt->fetchColumn();

        // Get active projects
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM projects 
            WHERE status IN ('scheduled', 'in_progress')
        ");
        $stmt->execute();
        $activeProjects = $stmt->fetchColumn();

        // Get new inquiries (last 7 days)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM contact_inquiries 
            WHERE status = 'new' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $stmt->execute();
        $newInquiries = $stmt->fetchColumn();

        // Get monthly revenue (current month)
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(paid_amount), 0) as revenue
            FROM invoices 
            WHERE MONTH(invoice_date) = MONTH(CURRENT_DATE()) 
            AND YEAR(invoice_date) = YEAR(CURRENT_DATE())
            AND status = 'paid'
        ");
        $stmt->execute();
        $monthlyRevenue = $stmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'totalCustomers' => (int)$totalCustomers,
            'activeProjects' => (int)$activeProjects,
            'newInquiries' => (int)$newInquiries,
            'monthlyRevenue' => formatCurrency($monthlyRevenue)
        ]);

    } catch (PDOException $e) {
        logError("Admin overview API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load overview data']);
    }
}

// Handle recent inquiries
function handleInquiries($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT ci.id, ci.name, ci.email, ci.phone, ci.service_type, 
                   ci.status, ci.priority, ci.created_at, ci.message,
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
            FROM contact_inquiries ci
            LEFT JOIN users u ON ci.assigned_to = u.id
            ORDER BY ci.created_at DESC 
            LIMIT 20
        ");
        $stmt->execute();
        $inquiries = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'inquiries' => $inquiries
        ]);

    } catch (PDOException $e) {
        logError("Admin inquiries API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load inquiries']);
    }
}

// Handle projects overview
function handleProjects($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT p.id, p.project_name, p.status, p.progress_percentage, 
                   p.estimated_completion, p.priority, p.estimated_cost,
                   CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                   t.team_name
            FROM projects p
            JOIN users u ON p.customer_id = u.id
            LEFT JOIN teams t ON p.assigned_team_id = t.id
            WHERE p.status IN ('planning', 'scheduled', 'in_progress')
            ORDER BY p.priority DESC, p.estimated_completion ASC
            LIMIT 15
        ");
        $stmt->execute();
        $projects = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'projects' => $projects
        ]);

    } catch (PDOException $e) {
        logError("Admin projects API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load projects']);
    }
}

// Handle team status
function handleTeamStatus($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT u.id, u.first_name, u.last_name, u.user_type,
                   t.team_name, tm.role,
                   CASE 
                       WHEN EXISTS (
                           SELECT 1 FROM appointments a 
                           WHERE a.assigned_staff_id = u.id 
                           AND DATE(a.appointment_date) = CURDATE()
                           AND a.status IN ('confirmed', 'in_progress')
                       ) THEN 'on-site'
                       ELSE 'available'
                   END as status
            FROM users u
            LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.active = 1
            LEFT JOIN teams t ON tm.team_id = t.id
            WHERE u.user_type = 'staff' AND u.active = 1
            ORDER BY u.first_name, u.last_name
        ");
        $stmt->execute();
        $teamMembers = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'team_members' => $teamMembers
        ]);

    } catch (PDOException $e) {
        logError("Admin team status API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load team status']);
    }
}

// Handle revenue data
function handleRevenue($pdo) {
    try {
        // Get monthly revenue for last 6 months
        $stmt = $pdo->prepare("
            SELECT 
                DATE_FORMAT(invoice_date, '%Y-%m') as month,
                SUM(paid_amount) as revenue
            FROM invoices 
            WHERE invoice_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            AND status = 'paid'
            GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
            ORDER BY month ASC
        ");
        $stmt->execute();
        $revenueData = $stmt->fetchAll();

        // Format for chart display
        $chartData = [];
        $maxRevenue = 0;
        
        foreach ($revenueData as $data) {
            $revenue = (float)$data['revenue'];
            $chartData[] = [
                'month' => date('M', strtotime($data['month'] . '-01')),
                'revenue' => $revenue
            ];
            $maxRevenue = max($maxRevenue, $revenue);
        }

        // Calculate percentages for chart bars
        foreach ($chartData as &$data) {
            $data['percentage'] = $maxRevenue > 0 ? ($data['revenue'] / $maxRevenue) * 100 : 0;
        }

        echo json_encode([
            'success' => true,
            'revenue_data' => $chartData,
            'max_revenue' => $maxRevenue
        ]);

    } catch (PDOException $e) {
        logError("Admin revenue API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load revenue data']);
    }
}

// Handle inquiry assignment
function handleAssignInquiry($pdo, $currentUserId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $inquiryId = $_POST['inquiry_id'] ?? null;
    $assignToId = $_POST['assign_to_id'] ?? null;
    $status = $_POST['status'] ?? 'contacted';

    if (!$inquiryId) {
        http_response_code(400);
        echo json_encode(['error' => 'Inquiry ID required']);
        return;
    }

    try {
        // Update inquiry
        $stmt = $pdo->prepare("
            UPDATE contact_inquiries 
            SET assigned_to = ?, status = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$assignToId, $status, $inquiryId]);

        // Create notification if assigned to someone
        if ($assignToId) {
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, created_at)
                VALUES (?, ?, ?, 'info', NOW())
            ");
            $message = "You have been assigned a new customer inquiry #$inquiryId";
            $stmt->execute([$assignToId, 'New Assignment', $message]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Inquiry updated successfully'
        ]);

    } catch (PDOException $e) {
        logError("Assign inquiry error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to assign inquiry']);
    }
}

// Handle project updates
function handleUpdateProject($pdo, $currentUserId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $projectId = $_POST['project_id'] ?? null;
    $status = $_POST['status'] ?? null;
    $teamId = $_POST['team_id'] ?? null;
    $priority = $_POST['priority'] ?? null;

    if (!$projectId) {
        http_response_code(400);
        echo json_encode(['error' => 'Project ID required']);
        return;
    }

    try {
        $updateFields = ['updated_at = NOW()'];
        $params = [];

        if ($status) {
            $updateFields[] = 'status = ?';
            $params[] = $status;
        }

        if ($teamId) {
            $updateFields[] = 'assigned_team_id = ?';
            $params[] = $teamId;
        }

        if ($priority) {
            $updateFields[] = 'priority = ?';
            $params[] = $priority;
        }

        $params[] = $projectId;

        $stmt = $pdo->prepare("
            UPDATE projects 
            SET " . implode(', ', $updateFields) . "
            WHERE id = ?
        ");
        $stmt->execute($params);

        echo json_encode([
            'success' => true,
            'message' => 'Project updated successfully'
        ]);

    } catch (PDOException $e) {
        logError("Update project error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update project']);
    }
}

// Handle user management
function handleUserManagement($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, first_name, last_name, email, user_type, 
                   verified, active, created_at, last_login
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $stmt->execute();
        $users = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'users' => $users
        ]);

    } catch (PDOException $e) {
        logError("User management API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load users']);
    }
}

// Handle system statistics
function handleSystemStats($pdo) {
    try {
        // Get various system statistics
        $stats = [];

        // Total users by type
        $stmt = $pdo->prepare("
            SELECT user_type, COUNT(*) as count 
            FROM users 
            WHERE active = 1 
            GROUP BY user_type
        ");
        $stmt->execute();
        $stats['users_by_type'] = $stmt->fetchAll();

        // Projects by status
        $stmt = $pdo->prepare("
            SELECT status, COUNT(*) as count 
            FROM projects 
            GROUP BY status
        ");
        $stmt->execute();
        $stats['projects_by_status'] = $stmt->fetchAll();

        // Recent activity
        $stmt = $pdo->prepare("
            SELECT 'inquiry' as type, created_at, name as title
            FROM contact_inquiries 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            UNION ALL
            SELECT 'project' as type, created_at, project_name as title
            FROM projects 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->execute();
        $stats['recent_activity'] = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);

    } catch (PDOException $e) {
        logError("System stats API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load system statistics']);
    }
}
?>