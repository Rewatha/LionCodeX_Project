<?php
// SealTech Engineering - Staff Dashboard API
// File: staff-api.php

session_start();
header('Content-Type: application/json');

// Include configuration
require_once 'config.php';

// Check if user is logged in and is staff
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if ($_SESSION['user_type'] !== 'staff') {
    http_response_code(403);
    echo json_encode(['error' => 'Staff access required']);
    exit;
}

// Get current staff user ID
$currentUserId = $_SESSION['user_id'];

// Get action from request
$action = $_GET['action'] ?? '';

// Connect to database
try {
    $pdo = Database::getInstance()->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    logError("Staff API database connection failed: " . $e->getMessage());
    exit;
}

// Route actions
switch ($action) {
    case 'schedule':
        handleTodaySchedule($pdo, $currentUserId);
        break;
    case 'projects':
        handleAssignedProjects($pdo, $currentUserId);
        break;
    case 'tasks':
        handleTaskProgress($pdo, $currentUserId);
        break;
    case 'equipment':
        handleEquipmentStatus($pdo, $currentUserId);
        break;
    case 'update-task':
        handleUpdateTask($pdo, $currentUserId);
        break;
    case 'clock-status':
        handleClockStatus($pdo, $currentUserId);
        break;
    case 'update-progress':
        handleUpdateProgress($pdo, $currentUserId);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

// Handle today's schedule
function handleTodaySchedule($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("
            SELECT a.id, a.appointment_type, a.appointment_date, a.duration_minutes,
                   a.location, a.description, a.status,
                   CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                   p.project_name
            FROM appointments a
            JOIN users u ON a.customer_id = u.id
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE a.assigned_staff_id = ? 
            AND DATE(a.appointment_date) = CURDATE()
            ORDER BY a.appointment_date ASC
        ");
        $stmt->execute([$userId]);
        $schedule = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'schedule' => $schedule
        ]);

    } catch (PDOException $e) {
        logError("Staff schedule API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load schedule']);
    }
}

// Handle assigned projects
function handleAssignedProjects($pdo, $userId) {
    try {
        // Get team assignments for this staff member
        $stmt = $pdo->prepare("
            SELECT p.id, p.project_name, p.project_type, p.location, 
                   p.status, p.progress_percentage, p.estimated_completion,
                   p.priority, p.description,
                   CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                   t.team_name
            FROM projects p
            JOIN users u ON p.customer_id = u.id
            LEFT JOIN teams t ON p.assigned_team_id = t.id
            LEFT JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = ? AND tm.active = 1
            AND p.status IN ('scheduled', 'in_progress')
            ORDER BY p.priority DESC, p.estimated_completion ASC
        ");
        $stmt->execute([$userId]);
        $projects = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'projects' => $projects
        ]);

    } catch (PDOException $e) {
        logError("Staff projects API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load projects']);
    }
}

// Handle task progress
function handleTaskProgress($pdo, $userId) {
    try {
        // Get tasks assigned to this staff member
        $stmt = $pdo->prepare("
            SELECT pt.id, pt.task_name, pt.description, pt.status,
                   pt.estimated_hours, pt.actual_hours, pt.due_date,
                   pt.completed_date, p.project_name
            FROM project_tasks pt
            JOIN projects p ON pt.project_id = p.id
            WHERE pt.assigned_to_id = ?
            AND pt.status != 'completed'
            ORDER BY pt.due_date ASC, pt.priority DESC
        ");
        $stmt->execute([$userId]);
        $tasks = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'tasks' => $tasks
        ]);

    } catch (PDOException $e) {
        logError("Staff tasks API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load tasks']);
    }
}

// Handle equipment status
function handleEquipmentStatus($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, equipment_name, equipment_type, status,
                   assigned_to_id
            FROM equipment
            WHERE assigned_to_id = ? OR assigned_to_id IS NULL
            ORDER BY equipment_type, equipment_name
        ");
        $stmt->execute([$userId]);
        $equipment = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'equipment' => $equipment
        ]);

    } catch (PDOException $e) {
        logError("Staff equipment API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load equipment']);
    }
}

// Handle task updates
function handleUpdateTask($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $taskId = $_POST['task_id'] ?? null;
    $status = $_POST['status'] ?? null;
    $hours = $_POST['hours'] ?? null;
    $notes = $_POST['notes'] ?? '';

    if (!$taskId || !$status) {
        http_response_code(400);
        echo json_encode(['error' => 'Task ID and status required']);
        return;
    }

    try {
        // Verify task belongs to this staff member
        $stmt = $pdo->prepare("
            SELECT id FROM project_tasks 
            WHERE id = ? AND assigned_to_id = ?
        ");
        $stmt->execute([$taskId, $userId]);
        
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Task not found or access denied']);
            return;
        }

        // Update task
        $updateFields = ['status = ?', 'updated_at = NOW()'];
        $params = [$status];

        if ($hours) {
            $updateFields[] = 'actual_hours = ?';
            $params[] = $hours;
        }

        if ($status === 'completed') {
            $updateFields[] = 'completed_date = NOW()';
        }

        $params[] = $taskId;

        $stmt = $pdo->prepare("
            UPDATE project_tasks 
            SET " . implode(', ', $updateFields) . "
            WHERE id = ?
        ");
        $stmt->execute($params);

        echo json_encode([
            'success' => true,
            'message' => 'Task updated successfully'
        ]);

    } catch (PDOException $e) {
        logError("Task update error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update task']);
    }
}

// Handle clock in/out status
function handleClockStatus($pdo, $userId) {
    try {
        // This would integrate with a time tracking system
        // For now, just return basic status
        echo json_encode([
            'success' => true,
            'clocked_in' => true,
            'clock_in_time' => '08:30',
            'total_hours' => '6.5'
        ]);

    } catch (Exception $e) {
        logError("Clock status error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get clock status']);
    }
}

// Handle project progress updates
function handleUpdateProgress($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $projectId = $_POST['project_id'] ?? null;
    $progress = $_POST['progress'] ?? null;
    $notes = $_POST['notes'] ?? '';

    if (!$projectId || $progress === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Project ID and progress required']);
        return;
    }

    if ($progress < 0 || $progress > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Progress must be between 0 and 100']);
        return;
    }

    try {
        // Verify staff member has access to this project
        $stmt = $pdo->prepare("
            SELECT p.id 
            FROM projects p
            LEFT JOIN teams t ON p.assigned_team_id = t.id
            LEFT JOIN team_members tm ON t.id = tm.team_id
            WHERE p.id = ? AND tm.user_id = ? AND tm.active = 1
        ");
        $stmt->execute([$projectId, $userId]);
        
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Project not found or access denied']);
            return;
        }

        // Update project progress
        $stmt = $pdo->prepare("
            UPDATE projects 
            SET progress_percentage = ?, 
                notes = CONCAT(COALESCE(notes, ''), '\n', ?, ' - Progress updated to ', ?, '% by staff member'),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$progress, $notes, $progress, $projectId]);

        echo json_encode([
            'success' => true,
            'message' => 'Project progress updated successfully'
        ]);

    } catch (PDOException $e) {
        logError("Progress update error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update progress']);
    }
}
?>